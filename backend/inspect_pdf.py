import pdfplumber

pdf_path = "Duty Hrs Statistics Report.pdf"

try:
    with pdfplumber.open(pdf_path) as pdf:
        if len(pdf.pages) > 0:
            page = pdf.pages[0]
            text = page.extract_text()
            print(f"--- Page 1 Text ---\n{text[:1000]}...") # Print first 1000 chars
            
            words = page.extract_words()
            print(f"\n--- First 20 Words ---\n{words[:20]}")
        else:
            print("PDF has no pages.")
except Exception as e:
    print(f"Error: {e}")
