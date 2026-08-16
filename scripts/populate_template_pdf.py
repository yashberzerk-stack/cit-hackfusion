#!/usr/bin/env python3
from pypdf import PdfReader, PdfWriter
from fpdf import FPDF
import io
import os

TEMPLATE = '6a71812004963_HackFusion_PPT_template.pdf'
OUT = 'ClauseGuard_filled.pdf'

# Slides content mapping (excluding team details on slide 1)
SLIDES = [
    {
        'title': 'ClauseGuard: AI-Powered T&C & Privacy Policy Risk Analyzer',
        'subtitle': '',
        'notes': ''
    },
    {
        'title': 'Problem Statement',
        'bullets': [
            'Digital users click "I Agree" on lengthy legal agreements every day without reading them.',
            'Documents span 20–80 pages of dense legalese; meaningful consent is nearly impossible.',
            'Users may forfeit data ownership, accept hidden renewals, and allow extensive tracking.'
        ]
    },
    {
        'title': 'Proposed Solution',
        'bullets': [
            'Intelligent analyzer translating legal documents into risk scores and plain-English explanations.',
            'Ingest via URL, pasted text, or extension; surface hidden clauses and provide "Why you should care".'
        ]
    },
    {
        'title': 'Features',
        'bullets': [
            'User Risk Profile Dashboard: Privacy, Data Sharing, Ownership, Account Control.',
            'Hidden Clause Finder: auto-detects arbitration, auto-renewals, retention, data sale.',
            'Plain English Translator and side-by-side service comparison.',
            'Live browser extension prototype for real-time alerts.'
        ]
    },
    {
        'title': 'Idea / Approach',
        'bullets': [
            'Frontend: React.js + Tailwind CSS',
            'AI & NLP Engine: FastAPI + LLM (Llama 3 / GPT-4o mini)',
            'Backend: PostgreSQL + Redis for caching',
            'Extension: Chrome extension pipeline for real-time overlays'
        ]
    },
    {
        'title': 'System Architecture / Workflow',
        'bullets': [
            'Ingestion: scrape or accept raw policy text/URLs.',
            'NLP Parsing: chunk & classify clauses into risk categories.',
            'Risk Scoring: compute severity metrics.',
            'Simplification: translate flagged clauses to plain English.'
        ]
    },
    {
        'title': 'Innovation & Advantage',
        'bullets': [
            'Focus on consumer risk, not just summaries.',
            'Direct comparison view for evaluating alternatives.',
            'Active alerts for non-standard user clauses.'
        ]
    },
    {
        'title': 'Impact & Future Scope',
        'bullets': [
            'Restores informed consent and prevents accidental data loss.',
            'Scales across browsing, app evaluation, and procurement.',
            'Future: automated negotiation, compliance tracking, crowdsourced warnings.'
        ]
    },
    {
        'title': 'Thank You',
        'bullets': ['Open for Questions & Answers']
    }
]

# Simple helper to create an overlay PDF page with text
def make_overlay_page(width_pt, height_pt, title='', bullets=None, subtitle='', is_title_slide=False):
    pdf = FPDF(unit='pt', format=(width_pt, height_pt))
    pdf.add_page()
    pdf.set_auto_page_break(False)

    # Title
    pdf.set_font('Helvetica', 'B', 28)
    if is_title_slide:
        # Centered title near top
        pdf.set_xy(40, 120)
        pdf.multi_cell(width_pt - 80, 32, title, align='C')
        # leave team details area blank (do not write anything in lower-left quadrant)
    else:
        pdf.set_xy(40, 70)
        pdf.multi_cell(width_pt - 80, 22, title)

    # Bullets
    if bullets:
        pdf.set_font('Helvetica', '', 12)
        x = 60
        y = 140 if not is_title_slide else 220
        line_h = 16
        for b in bullets:
            # simple wrapping (avoid Unicode bullets for builtin font)
            txt = f"- {b}"
            pdf.set_xy(x, y)
            pdf.multi_cell(width_pt - 120, line_h, txt)
            # estimate lines consumed
            lines = txt.count('\n') + 1
            y += lines * line_h + 6
    # Subtitle or notes (smaller)
    if subtitle:
        pdf.set_font('Helvetica', '', 11)
        pdf.set_xy(40, height_pt - 120)
        pdf.multi_cell(width_pt - 80, 14, subtitle)

    # return bytes
    bio = io.BytesIO()
    pdf.output(bio)
    bio.seek(0)
    return bio


def main():
    if not os.path.exists(TEMPLATE):
        print('Template not found:', TEMPLATE)
        return

    reader = PdfReader(TEMPLATE)
    writer = PdfWriter()

    num_pages = len(reader.pages)
    def sanitize(s):
        if not s:
            return s
        return (
            s.replace('–', '-').replace('—', '-').replace('…', '...').replace('“', '"').replace('”', '"').replace("’", "'")
        )

    for i in range(num_pages):
        page = reader.pages[i]
        mediabox = page.mediabox
        width = float(mediabox.width)
        height = float(mediabox.height)

        # Determine which slide content to place on this page (1-based)
        slide_idx = i  # 0-based
        overlay_bio = None
        if slide_idx < len(SLIDES):
            s = SLIDES[slide_idx]
            is_title = slide_idx == 0
            title = sanitize(s.get('title',''))
            bullets = [sanitize(x) for x in (s.get('bullets') or [])]
            subtitle = sanitize(s.get('subtitle',''))
            overlay_bio = make_overlay_page(width, height, title=title, bullets=bullets, subtitle=subtitle, is_title_slide=is_title)

        if overlay_bio:
            overlay_pdf = PdfReader(overlay_bio)
            overlay_page = overlay_pdf.pages[0]
            # merge overlay_page onto original page (overlay on top)
            page.merge_page(overlay_page)
        writer.add_page(page)

    with open(OUT, 'wb') as f:
        writer.write(f)
    print('Wrote', OUT)

if __name__ == '__main__':
    main()
