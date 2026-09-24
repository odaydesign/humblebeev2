#!/usr/bin/env python3
"""Extract scraped Webflow pages into structured JSON for the clone.

Outputs:
  src/lib/pages/index.json       -> [{slug, title, template}]
  src/lib/pages/{slug}.json      -> per-page data
  src/lib/collections.json       -> {programs, work: {featured, items}, stories}
  _source/legacy_classes.txt     -> class names used across pages (for CSS port)
"""
import re, os, json, glob, html as htmllib

SRC = os.path.dirname(os.path.abspath(__file__)) + '/../_source'
PAGES = SRC + '/pages'
OUT = os.path.dirname(os.path.abspath(__file__)) + '/../src/lib/pages'
IMGMAP = json.loads(open(SRC + '/imgmap.json').read())

CDN = re.compile(r'https://cdn\.prod\.website-files\.com/[^"\'\s)]+')
SITE_LINK = re.compile(r'https://(?:www\.)?humblebee\.se(/[^"\'\s]*)?')

PAGE_SLUGS = {
    '/' + os.path.relpath(f, PAGES)[:-5].replace(os.sep, '/')
    for f in glob.glob(PAGES + '/**/*.html', recursive=True)
} - {'/home'}  # homepage lives at '/', not '/home'

def localise_links(s):
    """Rewrite https://humblebee.se/<path> to a local route when we have the page."""
    def rep(m):
        p = (m.group(1) or '/').split('?')[0].split('#')[0] or '/'
        if p != '/' and p.endswith('/'):
            p = p[:-1]
        if p == '/' or p == '/home':
            return '/'
        return p if p in PAGE_SLUGS else m.group(0)
    return SITE_LINK.sub(rep, s)

def localise(s):
    def rep(m):
        u = m.group(0)
        if u in IMGMAP:
            return IMGMAP[u]
        if '-p-' in u:  # srcset variant -> use original asset
            base = re.sub(r'-p-\d+(?=\.(?:png|jpg|jpeg|webp|avif|gif|svg))', '', u)
            return IMGMAP.get(base, u)
        return u
    return CDN.sub(rep, s)

def strip_attrs(html):
    # drop srcset/sizes (we only keep original images)
    html = re.sub(r'\s+srcset="[^"]*"', '', html)
    html = re.sub(r'\s+sizes="[^"]*"', '', html)
    # drop webflow interaction + widget attrs
    html = re.sub(r'\s+data-w-id="[^"]*"', '', html)
    html = re.sub(r'\s+fs-[a-z-]+="[^"]*"', '', html)
    # strip IX inline state styles (transform/opacity), keep other styles
    def stl(m):
        v = m.group(1)
        if 'translate3d' in v or 'scale3d' in v or 'rotate' in v or 'opacity' in v or 'transform' in v:
            return ''
        return m.group(0)
    html = re.sub(r'\s+style="([^"]*)"', stl, html)
    return html

def clean_html(html):
    html = re.sub(r'<script.*?</script>', '', html, flags=re.S)
    html = re.sub(r'<!--.*?-->', '', html, flags=re.S)
    html = strip_attrs(html)
    html = localise(html)
    html = localise_links(html)
    html = re.sub(r'>\s+<', '><', html)
    return html.strip()

def get_main(raw):
    i = raw.find('<div class="main-wrapper">')
    if i < 0:
        return ''
    j = raw.find('<section class="footer-component-black', i)
    if j < 0:
        j = raw.find('</body>', i)
    return raw[i:j]

def text_of(html):
    t = re.sub(r'<[^>]+>', '', html)
    return htmllib.unescape(t).strip()

def attr(tag, name):
    m = re.search(name + r'="([^"]*)"', tag)
    return htmllib.unescape(m.group(1)) if m else ''

def meta(raw):
    t = re.search(r'<title>(.*?)</title>', raw, re.S)
    d = re.search(r'<meta content="([^"]*)" name="description"', raw)
    return (text_of(t.group(1)) if t else '', htmllib.unescape(d.group(1)) if d else '')

def block(html, cls, start=0):
    """Return inner-ish html of first element having class cls (greedy-ish)."""
    i = html.find(cls)
    if i < 0:
        return ''
    # back up to the tag open
    t = html.rfind('<', 0, i)
    m = re.match(r'<(\w+)', html[t:])
    if not m:
        return ''
    tag = m.group(1)
    depth, k = 0, t
    for mm in re.finditer(r'<(/?)(\w+)([^>]*)>', html[t:], re.S):
        name, closing, rest = mm.group(2), mm.group(1), mm.group(3)
        if name != tag:
            continue
        if closing:
            depth -= 1
            if depth == 0:
                return html[t:t + mm.end()]
        elif rest.strip().endswith('/'):
            continue
        else:
            depth += 1
    return html[t:]

CHROME_TOKENS = (
    'nav-', 'nav_', '#stw', '.stw', 'marquee', 'email-copy', 'sm-icon',
    'strategymoves', 'programs-item', 'programs-wrap', 'programs-list',
    'footer', 'btn-pill', 'btn-blue', 'btn-ghost', 'challenges', 'hero-',
)

def strip_chrome(css):
    """Remove rules targeting site chrome (nav/marquee/pills/footer) — our own
    components own those styles; injected originals break the clone's nav."""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    def scrub(block):
        out = []
        i = 0
        n = len(block)
        while i < n:
            while i < n and block[i] in ' \n\t':
                i += 1
            if i >= n or block[i] == '}':
                i += 1
                continue
            j = block.find('{', i)
            if j < 0:
                break
            header = block[i:j].strip()
            depth, k = 1, j + 1
            while k < n and depth:
                if block[k] == '{':
                    depth += 1
                elif block[k] == '}':
                    depth -= 1
                k += 1
            body = block[j + 1:k - 1]
            i = k
            if header.startswith('@media') or header.startswith('@supports'):
                inner = scrub(body)
                if inner.strip():
                    out.append(f'{header} {{{inner}}}')
            elif not any(t in header for t in CHROME_TOKENS):
                out.append(f'{header} {{{body}}}')
        return '\n'.join(out)
    return scrub(css)

def page_styles(raw):
    """Page-specific <style> blocks (skip webflow global), minus chrome rules."""
    out = []
    for m in re.finditer(r'<style[^>]*>(.*?)</style>', raw, re.S):
        s = m.group(1).strip()
        if s and 'webflow' not in s[:60]:
            s = strip_chrome(s)
            if s.strip():
                out.append(s)
    return '\n'.join(out)

# ── structured extractors ──────────────────────────────────────

def ex_program(mw):
    d = {'template': 'program'}
    m = re.search(r'text-style-service">([^<]*)<', mw)
    d['eyebrow'] = m.group(1).strip() if m else 'Program'
    m = re.search(r'heading-style-h1">([^<]*)<', mw)
    d['title'] = text_of(m.group(1)) if m else ''
    m = re.search(r'<h3[^>]*>(.*?)</h3>', mw, re.S)
    d['subtitle'] = text_of(m.group(1)) if m else ''
    m = re.search(r'<img[^>]*class="[^"]*services_image[^"]*"[^>]*>', mw)
    if m:
        d['image'] = attr(localise(m.group(0)), 'src')
        d['imageAlt'] = attr(m.group(0), 'alt')
    # outcomes (scoped to the outcome list only)
    olist = block(mw, 'program-outcome-list')
    d['outcomes'] = [text_of(x) for x in re.findall(r'class="text-block-2\d"[^>]*>(.*?)</div>', olist, re.S)]
    m = re.search(r'<h4[^>]*class="[^"]*heading-100[^"]*"[^>]*>(.*?)</h4>', mw, re.S)
    d['outcomeHeading'] = text_of(m.group(1)) if m else ''
    m = re.search(r'<h3[^>]*class="[^"]*heading-98[^"]*"[^>]*>(.*?)</h3>', mw, re.S)
    d['statement'] = text_of(m.group(1)) if m else ''
    m = re.search(r'<h4[^>]*class="[^"]*heading-93[^"]*"[^>]*>(.*?)</h4>', mw, re.S)
    d['featuresHeading'] = text_of(m.group(1)) if m else 'Program Features'
    m = re.search(r'class="text-block-27"[^>]*>(.*?)</div>', mw, re.S)
    d['featuresIntro'] = text_of(m.group(1)) if m else ''
    d['features'] = [{'title': text_of(a), 'body': text_of(b)} for a, b in
                     re.findall(r'program-features-card-title">(.*?)</p>\s*<p[^>]*class="program-features-card-copy"[^>]*>(.*?)</p>', mw, re.S)]
    # is this for you
    fy = block(mw, 'service-list')
    d['forYouHeading'] = text_of(re.search(r'<h4[^>]*>(.*?)</h4>', block(mw, 'margin-bottom-8') or mw, re.S).group(1)) if re.search(r'<h4[^>]*>(.*?)</h4>', block(mw, 'margin-bottom-8') or '', re.S) else 'Is this program for you?'
    d['forYou'] = [text_of(x) for x in re.findall(r'service-list-item"[^>]*>(.*?)</li>', fy, re.S)]
    # opportunities
    d['opportunitiesHeading'] = ''
    m = re.search(r'<h4[^>]*class="[^"]*text-align-left[^"]*"[^>]*>(.*?)</h4>', mw[mw.find('impact-grid')-2000:] if 'impact-grid' in mw else '', re.S)
    opsec = mw[:mw.find('impact-grid')] if 'impact-grid' in mw else ''
    hs = re.findall(r'<h4[^>]*>(.*?)</h4>', opsec[-1200:], re.S)
    d['opportunitiesHeading'] = text_of(hs[-1]) if hs else ''
    m2 = re.search(r'impact-grid"[^>]*>', mw)
    tail = mw[mw.find('impact-grid'):]
    d['opportunities'] = [{'title': text_of(a), 'body': text_of(b)} for a, b in
                          re.findall(r'<h5[^>]*>(.*?)</h5>\s*<div[^>]*>(.*?)</div>', tail[:tail.find('</section')] if '</section' in tail else tail, re.S)][:12]
    d['opportunitiesIntro'] = ''
    oppre = mw[mw.find('impact-grid')-600:mw.find('impact-grid')]
    m3 = re.search(r'<div>(.*?)</div>\s*$', oppre, re.S)
    if m3: d['opportunitiesIntro'] = text_of(m3.group(1))
    # cta banner
    cta = block(mw, 'is-landing')
    if cta:
        m = re.search(r'<h3[^>]*>(.*?)</h3>', cta, re.S)
        m2 = re.search(r'<p[^>]*>(.*?)</p>', cta, re.S)
        m3 = re.search(r'<a[^>]*href="([^"]*)"[^>]*class="[^"]*btn-blue[^"]*"', cta)
        m4 = re.search(r'<img[^>]*class="[^"]*header_image[^"]*"[^>]*>', cta)
        m5 = re.search(r'btn-blue-label">([^<]*)<', cta)
        d['cta'] = {
            'heading': text_of(m.group(1)) if m else "Let's chat",
            'body': text_of(m2.group(1)) if m2 else '',
            'btnLabel': text_of(m5.group(1)) if m5 else 'Book a Meeting',
            'btnHref': m3.group(1) if m3 else '/contact',
            'image': attr(localise(m4.group(0)), 'src') if m4 else '',
        }
    return d

def ex_case(mw):
    d = {'template': 'case'}
    m = re.search(r'class="work-title"[^>]*>\s*<h1[^>]*>(.*?)</h1>', mw, re.S)
    d['title'] = text_of(m.group(1)) if m else ''
    ov = block(mw, 'overview-content')
    p = re.search(r'<p[^>]*>(.*?)</p>', ov, re.S)
    d['overview'] = text_of(p.group(1)) if p else ''
    a = re.search(r'<a[^>]*href="([^"]+)"[^>]*class="[^"]*strategymoves-btn[^"]*"', ov)
    if a:
        d['siteLink'] = a.group(1)
        lbl = re.search(r'<div>([^<]*)</div>', ov[ov.find('button-group'):])
        d['siteLinkLabel'] = text_of(lbl.group(1)) if lbl else 'Visit the site'
    # meta list
    d['meta'] = []
    ol = block(mw, 'overview_list')
    for mm in re.finditer(r'overview-title"[^>]*>(.*?)</div>\s*<div[^>]*>(.*?)</div>\s*(?:</div>)?', ol, re.S):
        k, v = text_of(mm.group(1)), mm.group(2)
        items = [text_of(x) for x in re.findall(r'class="text-block[^"]*"[^>]*>(.*?)</div>', v, re.S)]
        val = ', '.join(items) if items else text_of(v)
        d['meta'].append({'label': k, 'value': val})
    # body richtext
    rt = block(mw, 'work-details')
    d['bodyHtml'] = clean_html(rt) if rt else ''
    # contact
    cta = block(mw, 'work-cta')
    h4 = re.search(r'<h4[^>]*>(.*?)</h4>', cta, re.S)
    d['ctaHeading'] = text_of(h4.group(1)) if h4 else ''
    wc = block(mw, 'work-contact')
    if wc:
        img = re.search(r'<img[^>]*>', wc)
        name = re.search(r'text-size-medium[^"]*"[^>]*>(.*?)</h4>', wc, re.S)
        mail = re.search(r'href="mailto:([^"]+)"', wc)
        tel = re.search(r'href="tel:([^"]+)"', wc)
        d['contact'] = {
            'image': attr(localise(img.group(0)), 'src') if img else '',
            'name': text_of(name.group(1)) if name else '',
            'email': mail.group(1) if mail else '',
            'phone': tel.group(1) if tel else '',
        }
    # coffee banner
    cb = block(mw, 'background-color-light-yellow')
    if cb:
        h = re.search(r'<h2[^>]*>(.*?)</h2>', cb, re.S)
        p = re.search(r'coffeecta_rightcopy[^"]*"[^>]*>(.*?)</p>', cb, re.S)
        a = re.search(r'<a[^>]*href="([^"]+)"[^>]*class="[^"]*strategymoves-btn', cb)
        img = re.search(r'<img[^>]*>', cb)
        d['coffeeBanner'] = {
            'heading': text_of(h.group(1)) if h else '',
            'body': text_of(p.group(1)) if p else '',
            'btnHref': a.group(1) if a else '/contact',
            'btnLabel': 'Book a Meeting',
            'image': attr(localise(img.group(0)), 'src') if img else '',
        }
    return d

def ex_story(mw):
    d = {'template': 'story'}
    m = re.search(r'class="story-h1"[^>]*>(.*?)</h1>', mw, re.S)
    d['title'] = text_of(m.group(1)) if m else ''
    # optional h5 subtitle right after title block
    after = mw[mw.find('story-h1'):]
    m = re.search(r'</h1>\s*(?:</div>)?\s*<h5[^>]*>(.*?)</h5>', after, re.S)
    d['subtitle'] = text_of(m.group(1)) if m else ''
    aw = block(mw, 'author_wrapper')
    if aw:
        img = re.search(r'<img[^>]*>', aw)
        nm = re.search(r'author_name"[^>]*>(.*?)</div>', aw, re.S)
        dt = re.search(r'author_date"[^>]*>(.*?)</div>', aw, re.S)
        d['author'] = {
            'image': attr(localise(img.group(0)), 'src') if img else '',
            'name': text_of(nm.group(1)) if nm else '',
            'date': text_of(dt.group(1)) if dt else '',
        }
    # hero image = first img in margin-large after author
    herosec = mw[mw.find('author_wrapper'):]
    m = re.search(r'margin-large">\s*<img([^>]*)>', herosec, re.S)
    if m:
        d['heroImage'] = attr(localise('<img' + m.group(1) + '>'), 'src')
        d['heroAlt'] = attr(m.group(0), 'alt')
    rt = block(mw, 'story-text')
    d['bodyHtml'] = clean_html(rt) if rt else ''
    # written-by block at article end
    wb = block(mw, 'is-story')
    if wb:
        img = re.search(r'<img[^>]*class="[^"]*author-img-story[^"]*"[^>]*>', wb)
        nm = re.search(r'author_date"[^>]*>Written by</div>\s*<div[^>]*>(.*?)</div>', wb, re.S)
        em = re.search(r'href="mailto:([^"]+)"', wb)
        d['writtenBy'] = {
            'image': attr(localise(img.group(0)), 'src') if img else '',
            'name': text_of(nm.group(1)) if nm else '',
            'email': em.group(1) if em else '',
        }
    # related story hrefs in the "More stories" list
    more = mw[mw.find('is-more'):] if 'is-more' in mw else ''
    d['related'] = list(dict.fromkeys(re.findall(r'href="(/stories/[^"]+)"', more)))
    return d

def ex_index_stories(mw):
    items = []
    seen = set()
    chunks = mw.split('role="listitem" class="teamitems w-dyn-item">')[1:]
    # tab categories: which hrefs belong to each w-tab-pane
    categories = []
    for pane in re.finditer(r'data-w-tab="([^"]+)"[^>]*class="w-tab-pane[^"]*"', mw):
        name = pane.group(1)
        seg = mw[pane.end():]
        nxt = re.search(r'class="w-tab-pane', seg)
        if nxt:
            seg = seg[:nxt.start()]
        hrefs = re.findall(r'class="work_image-wrapper w-inline-block"[^>]*>|href="(/stories/[^"]+)"', seg)
        hrefs = [h for h in re.findall(r'href="(/stories/[^"]+)"', seg)]
        categories.append({'name': name, 'hrefs': list(dict.fromkeys(hrefs))})
    for seg in chunks:
        a = re.search(r'<a[^>]*href="([^"]+)"[^>]*class="[^"]*work_image-wrapper', seg)
        if not a:
            continue
        img = re.search(r'<img[^>]*>', seg)
        h = re.search(r'link-heading[^"]*"[^>]*>\s*<h5[^>]*>(.*?)</h5>', seg, re.S)
        ex = re.search(r'text-block-9[^"]*"[^>]*>(.*?)</div>', seg, re.S)
        aw = re.search(r'author_name"[^>]*>(.*?)</div>', seg, re.S)
        ad = re.search(r'author_date"[^>]*>(.*?)</div>', seg, re.S)
        aimg = re.findall(r'<img[^>]*class="author-img"[^>]*>', seg)
        if a.group(1) in seen:
            continue
        seen.add(a.group(1))
        items.append({
            'href': a.group(1),
            'image': attr(localise(img.group(0)), 'src') if img else '',
            'alt': attr(img.group(0), 'alt') if img else '',
            'title': text_of(h.group(1)) if h else '',
            'excerpt': text_of(ex.group(1)) if ex else '',
            'authorImage': attr(localise(aimg[0]), 'src') if aimg else '',
            'authorName': text_of(aw.group(1)) if aw else '',
            'authorDate': text_of(ad.group(1)) if ad else '',
        })
    return {'items': items, 'categories': categories}

def ex_index_work(mw):
    feat = {}
    f = re.search(r'<a[^>]*href="([^"]+)"[^>]*class="[^"]*work_image-wrapper is-top[^"]*"[^>]*>\s*<img([^>]*)>', mw, re.S)
    fc = re.search(r'is-top.*?header_content-wrapper">(.*?)</div>\s*</div>\s*</div>', mw, re.S)
    if f:
        feat['href'] = f.group(1)
        feat['image'] = attr(localise('<img' + f.group(2) + '>'), 'src')
        feat['alt'] = attr(f.group(2), 'alt')
    if fc:
        seg = fc.group(1)
        c = re.search(r'<div>([^<]+)</div>', seg)
        h = re.search(r'<h3[^>]*>(.*?)</h3>', seg, re.S)
        p = re.search(r'<p[^>]*>(.*?)</p>', seg, re.S)
        feat['client'] = text_of(c.group(1)) if c else ''
        feat['title'] = text_of(h.group(1)) if h else ''
        feat['excerpt'] = text_of(p.group(1)) if p else ''
    items = []
    for it in re.finditer(r'role="listitem" class="work_item w-dyn-item">(.*?)(?=role="listitem" class="work_item|</div>\s*</div>\s*</div>\s*</section>)', mw, re.S):
        seg = it.group(1)
        a = re.search(r'<a[^>]*href="([^"]+)"[^>]*class="[^"]*work_image-wrapper', seg)
        img = re.search(r'<img[^>]*>', seg)
        c = re.search(r'text-block-13"[^>]*>(.*?)</div>', seg, re.S)
        h = re.search(r'<h4[^>]*>(.*?)</h4>', seg, re.S)
        p = re.search(r'paragraph-9"[^>]*>(.*?)</p>', seg, re.S)
        items.append({
            'href': a.group(1) if a else '',
            'image': attr(localise(img.group(0)), 'src') if img else '',
            'alt': attr(img.group(0), 'alt') if img else '',
            'client': text_of(c.group(1)) if c else '',
            'title': text_of(h.group(1)) if h else '',
            'excerpt': text_of(p.group(1)) if p else '',
        })
    return {'featured': feat, 'items': items}

def ex_index_programs(mw):
    items = []
    for it in re.finditer(r'<a href="([^"]+)" class="programs-item[^"]*"[^>]*>.*?programs-item-title">(.*?)</h5>.*?programs-item-subtitle">(.*?)</div>', mw, re.S):
        items.append({'href': it.group(1), 'title': text_of(it.group(2)), 'subtitle': text_of(it.group(3))})
    h = re.search(r'heading-88">(.*?)</h1>', mw, re.S)
    s = re.search(r'heading-74[^"]*"[^>]*>(.*?)</h4>', mw, re.S)
    return {'heading': text_of(h.group(1)) if h else 'Programs',
            'subheading': text_of(s.group(1)) if s else '', 'items': items}

# ── main loop ──────────────────────────────────────────────────

os.makedirs(OUT, exist_ok=True)
index = []
collections = {'stories': [], 'work': {}, 'programs': {}}
used_classes = set()

for f in sorted(glob.glob(PAGES + '/**/*.html', recursive=True)):
    rel = os.path.relpath(f, PAGES)[:-5]
    slug = rel.replace(os.sep, '/')
    if slug == 'home':
        continue
    raw = open(f).read()
    title, desc = meta(raw)
    mw = get_main(raw)
    styles = page_styles(raw)

    is_program = 'program-intro' in mw
    is_case = 'work-title' in mw and 'overview-component' in mw
    is_story = 'story-h1' in mw
    is_legacy = not (is_program or is_case or is_story)

    entry = {'slug': slug, 'title': title, 'desc': desc}

    if slug == 'programs':
        collections['programs'] = ex_index_programs(mw)
        entry['template'] = 'programsIndex'
    elif slug == 'work':
        collections['work'] = ex_index_work(mw)
        entry['template'] = 'workIndex'
    elif slug == 'stories':
        collections['stories'] = ex_index_stories(mw)
        entry['template'] = 'storiesIndex'
    elif is_program:
        entry['template'] = 'program'
        entry['data'] = ex_program(mw)
    elif is_case:
        entry['template'] = 'case'
        entry['data'] = ex_case(mw)
    elif is_story:
        entry['template'] = 'story'
        entry['data'] = ex_story(mw)
    else:
        entry['template'] = 'legacy'
        entry['html'] = clean_html(mw)

    if styles:
        entry['css'] = styles

    for cl in re.findall(r'class="([^"]+)"', mw):
        used_classes.update(cl.split())

    fn = slug.replace('/', '__') + '.json'
    open(os.path.join(OUT, fn), 'w').write(json.dumps(entry, ensure_ascii=False))
    index.append({'slug': slug, 'title': title, 'template': entry['template']})

open(os.path.join(OUT, 'index.json'), 'w').write(json.dumps(index, ensure_ascii=False, indent=1))
open(OUT + '/../collections.json', 'w').write(json.dumps(collections, ensure_ascii=False))
open(SRC + '/legacy_classes.txt', 'w').write('\n'.join(sorted(used_classes)))

from collections import Counter
print(Counter(e['template'] for e in index))
print('total pages:', len(index))
print('stories:', len(collections['stories']), 'work items:', len(collections['work'].get('items', [])), 'programs:', len(collections['programs'].get('items', [])))
print('classes used:', len(used_classes))
