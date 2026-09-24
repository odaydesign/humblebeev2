#!/usr/bin/env python3
"""Build src/app/legacy.css: rules from webflow.css for classes used in
scraped pages but not already defined in globals.css."""
import re, os

BASE = os.path.dirname(os.path.abspath(__file__)) + '/..'
wf = open(BASE + '/_source/webflow.css').read()
glob_css = open(BASE + '/src/app/globals.css').read()
classes = set(open(BASE + '/_source/legacy_classes.txt').read().split())

owned = set(re.findall(r'\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)', glob_css))
extra_tags = {'ul', 'li', 'blockquote', 'figure'}

def blocks(css):
    """Top-level (header, body) blocks; body is inner text for @media."""
    out = []
    i, n = 0, len(css)
    while i < n:
        while i < n and css[i] in ' \n\t':
            i += 1
        if i >= n:
            break
        j = css.find('{', i)
        if j < 0:
            break
        header = css[i:j].strip()
        depth, k = 1, j + 1
        while k < n and depth:
            if css[k] == '{':
                depth += 1
            elif css[k] == '}':
                depth -= 1
            k += 1
        out.append((header, css[j + 1:k - 1]))
        i = k
    return out

def rules_in(css):
    for header, body in blocks(css):
        if not header.startswith('@'):
            yield header, body

top_rules = []          # (sel, body)
media_rules = []        # (cond, sel, body)
for header, body in blocks(wf):
    if header.startswith('@media'):
        cond = header[len('@media'):].strip()
        for sel, b in rules_in(body):
            media_rules.append((cond, sel, b))
    elif header.startswith('@'):
        continue  # font-face/keyframes: handled elsewhere
    else:
        top_rules.append((header, body))

def sel_classes(sel):
    return set(re.findall(r'\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)', sel))

def sel_tags(sel):
    return set(re.findall(r'(?:^|[\s>+~])([a-z][a-z0-9]*)\b', sel))

def want(sel):
    s = sel.strip()
    if s in (':root', 'html', 'body', 'html, body'):
        return True
    cs = sel_classes(sel)
    if cs & classes and not (cs & owned):
        return True
    if not cs and sel_tags(sel) & extra_tags:
        return True
    return False

out = [f'{sel} {{{body}}}' for sel, body in top_rules if want(sel)]

mqs = {}
for cond, sel, body in media_rules:
    if want(sel):
        mqs.setdefault(cond, []).append(f'{sel} {{{body}}}')

UTILITIES = '''/* Webflow global embed utilities (needed by structured templates too) */
.w-richtext > :not(div):first-child, .w-richtext > div:first-child > :first-child {margin-top:0 !important}
.w-richtext>:last-child, .w-richtext ol li:last-child, .w-richtext ul li:last-child {margin-bottom:0 !important}
.inherit-color * {color:inherit}
.pointer-events-off {pointer-events:none}
.pointer-events-on {pointer-events:auto}
.div-square::after {content:"";display:block;padding-bottom:100%}
.container-medium,.container-small,.container-large {margin-right:auto !important;margin-left:auto !important}
.text-style-3lines {display:-webkit-box;overflow:hidden;-webkit-line-clamp:3;-webkit-box-orient:vertical}
.text-style-2lines {display:-webkit-box;overflow:hidden;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.display-inlineflex {display:inline-flex}
.truncate-width {width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.spacing-clean {padding:0 !important;margin:0 !important}
.no-scrollbar {-ms-overflow-style:none;overflow:-moz-scrollbars-none}
.no-scrollbar::-webkit-scrollbar {display:none}
.margin-0 {margin:0 !important}
.padding-0 {padding:0 !important}
.margin-top {margin-right:0 !important;margin-bottom:0 !important;margin-left:0 !important}
.padding-top {padding-right:0 !important;padding-bottom:0 !important;padding-left:0 !important}
.margin-right {margin-top:0 !important;margin-bottom:0 !important;margin-left:0 !important}
.padding-right {padding-top:0 !important;padding-bottom:0 !important;padding-left:0 !important}
.margin-bottom {margin-top:0 !important;margin-right:0 !important;margin-left:0 !important}
.padding-bottom {padding-top:0 !important;padding-right:0 !important;padding-left:0 !important}
.margin-left {margin-top:0 !important;margin-right:0 !important;margin-bottom:0 !important}
.padding-left {padding-top:0 !important;padding-right:0 !important;padding-bottom:0 !important}
.margin-horizontal {margin-top:0 !important;margin-bottom:0 !important}
.padding-horizontal {padding-top:0 !important;padding-bottom:0 !important}
.margin-vertical {margin-right:0 !important;margin-left:0 !important}
.padding-vertical {padding-right:0 !important;padding-left:0 !important}
.hide {display:none !important}
*[tabindex]:focus-visible,input[type="file"]:focus-visible {outline:.125rem solid #4d65ff;outline-offset:.125rem}
@media screen and (max-width:991px){.hide,.hide-tablet{display:none !important}}
@media screen and (max-width:767px){.hide-mobile-landscape{display:none !important}}
@media screen and (max-width:479px){.hide-mobile{display:none !important}}
'''

css = '/* Ported Webflow rules for legacy page rendering */\n' + '\n'.join(out) + '\n\n' + UTILITIES
order = ['screen and (max-width: 991px)', 'screen and (max-width:991px)',
         'screen and (max-width: 767px)', 'screen and (max-width:767px)',
         'screen and (max-width: 479px)', 'screen and (max-width:479px)']
for cond in order:
    if cond in mqs:
        css += f'\n\n@media {cond} {{\n' + '\n'.join(mqs.pop(cond)) + '\n}'
for cond, lst in mqs.items():
    css += f'\n\n@media {cond} {{\n' + '\n'.join(lst) + '\n}'

# Base-state display:none elements that the original reveals via Webflow IX
# interactions — we don't run IX, so reveal them statically. Must come last
# to win over the ported base rules.
css += '''
/* Clone overrides: elements the original reveals via IX (no IX runtime here) */
.author_wrapper {display:flex}
.text-block-9 {display:block}
.paragraph-9 {display:block}
.text-block-11 {display:block}
'''

open(BASE + '/src/app/legacy.css', 'w').write(css + '\n')
print('top rules:', len(out), '| media rules:', sum(len(v) for v in mqs.values()) + sum(0 for _ in []))
missing = sorted(c for c in classes if c not in owned and f'.{c}' not in css)
print('classes w/o rule:', len(missing))
print(missing[:80])
