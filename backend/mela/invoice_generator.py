import os
from django.conf import settings
from django.core.files.base import ContentFile
from io import BytesIO
from xhtml2pdf import pisa

def number_to_words(number):
    # Simple fallback implementation of number to words for major values
    units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", 
             "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
    
    def helper(n):
        if n < 20:
            return units[n]
        elif n < 100:
            return tens[n // 10] + (" " + units[n % 10] if n % 10 != 0 else "")
        elif n < 1000:
            return units[n // 100] + " Hundred" + (" and " + helper(n % 100) if n % 100 != 0 else "")
        elif n < 100000:
            return helper(n // 1000) + " Thousand" + (" " + helper(n % 1000) if n % 1000 != 0 else "")
        elif n < 10000000:
            return helper(n // 100000) + " Lakh" + (" " + helper(n % 100000) if n % 100000 != 0 else "")
        else:
            return helper(n // 10000000) + " Crore" + (" " + helper(n % 10000000) if n % 10000000 != 0 else "")
    
    try:
        val = int(round(number))
        if val == 0:
            return "Zero Rupees Only"
        return helper(val) + " Rupees Only"
    except:
        return f"{number} Rupees Only"

def generate_invoice_pdf(booking):
    total = float(booking.price)
    taxable = round(total / 1.05, 2)
    gst_total = round(total - taxable, 2)
    cgst = round(gst_total / 2, 2)
    sgst = round(gst_total / 2, 2)
    
    # Adjust for floating point rounding discrepancies
    if taxable + cgst + sgst != total:
        cgst = round((total - taxable) / 2, 2)
        sgst = total - taxable - cgst
        
    words = number_to_words(total)
    
    date_str = (booking.completed_at or booking.created_at).strftime("%d-%m-%Y")
    po_date_str = booking.created_at.strftime("%d-%m-%Y")
    
    # Format payment mode text
    pm_map = {
        'cash': 'Cash',
        'upi': 'KVR Motors UPI (351828801952 - 590201007448), Cash',
        'card': 'Debit/Credit Card',
        'bajaj_finance': 'Bajaj Finance'
    }
    payment_mode_text = pm_map.get(booking.payment_type, booking.payment_type.upper() if booking.payment_type else 'Cash')

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            @page {{
                size: a4 portrait;
                margin: 1.5cm;
            }}
            body {{
                font-family: Helvetica, Arial, sans-serif;
                font-size: 8px;
                line-height: 1.2;
                color: #000;
            }}
            .header-table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 5px;
            }}
            .header-table td {{
                border: 1px solid #000;
                padding: 4px;
                vertical-align: top;
            }}
            .logo-section {{
                width: 50%;
            }}
            .logo-title {{
                font-size: 14px;
                font-weight: bold;
            }}
            .logo-subtitle {{
                font-size: 7px;
                color: #333;
            }}
            .meta-section {{
                width: 50%;
            }}
            .meta-table {{
                width: 100%;
                border-collapse: collapse;
            }}
            .meta-table td {{
                border: none;
                border-bottom: 1px solid #ccc;
                padding: 2px;
                font-size: 8px;
            }}
            .meta-table tr:last-child td {{
                border-bottom: none;
            }}
            .bill-to {{
                width: 100%;
                border: 1px solid #000;
                padding: 5px;
                margin-bottom: 5px;
            }}
            .bill-to-title {{
                font-weight: bold;
                border-bottom: 1px solid #000;
                padding-bottom: 2px;
                margin-bottom: 3px;
                font-size: 9px;
            }}
            .items-table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 5px;
            }}
            .items-table th, .items-table td {{
                border: 1px solid #000;
                padding: 4px;
                text-align: left;
                font-size: 7px;
            }}
            .items-table th {{
                background-color: #f2f2f2;
                font-weight: bold;
                text-align: center;
            }}
            .text-center {{
                text-align: center !important;
            }}
            .text-right {{
                text-align: right !important;
            }}
            .summary-table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 5px;
            }}
            .summary-table td {{
                border: 1px solid #000;
                padding: 4px;
                vertical-align: top;
            }}
            .tax-table {{
                width: 100%;
                border-collapse: collapse;
                margin-top: 5px;
                margin-bottom: 5px;
            }}
            .tax-table th, .tax-table td {{
                border: 1px solid #000;
                padding: 3px;
                font-size: 7px;
            }}
            .footer-table {{
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }}
            .footer-table td {{
                border: 1px solid #000;
                padding: 5px;
                vertical-align: top;
                width: 33.33%;
            }}
            .bold {{
                font-weight: bold;
            }}
            .invoice-title-main {{
                text-align: center;
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }}
        </style>
    </head>
    <body>
        <div class="invoice-title-main">Tax Invoice</div>
        <table class="header-table">
            <tr>
                <td class="logo-section">
                    <div class="logo-title">KVR MOTORS</div>
                    <div class="logo-subtitle">
                        GROUND FLOOR, 54-1-13, ISUKATHOTA, MADDILAPALEM, KRANTHINAGAR, VISHAKAPATNAM, ANDHRAPRADESH,<br/>
                        Phone no.: 9391099576<br/>
                        Email: kvr.kinetic@gmail.com<br/>
                        GSTIN: 37GEWPK2874E1ZU<br/>
                        State: 37-Andhra Pradesh
                    </div>
                </td>
                <td class="meta-section">
                    <table class="meta-table">
                        <tr>
                            <td class="bold">Invoice No.</td>
                            <td>KVR26-27/{booking.booking_id.replace('MELA-', '')}</td>
                            <td class="bold">Date</td>
                            <td>{date_str}</td>
                        </tr>
                        <tr>
                            <td class="bold">Place of supply</td>
                            <td>37-Andhra Pradesh</td>
                            <td class="bold">PO date</td>
                            <td>{po_date_str}</td>
                        </tr>
                        <tr>
                            <td class="bold">PO number</td>
                            <td colspan="3">KVR-SO/{booking.booking_id.replace('MELA-', '')}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <div class="bill-to">
            <div class="bill-to-title">Bill To</div>
            <div class="bold" style="font-size: 9px;">{booking.customer_name}</div>
            <div>Visakhapatnam, Andhra Pradesh</div>
            <div>Contact No. : {booking.customer_phone}</div>
            <div>State: 37-Andhra Pradesh</div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 45%;">Item name</th>
                    <th style="width: 10%;">HSN/ SAC</th>
                    <th style="width: 10%;">Colour</th>
                    <th style="width: 5%;">Qty</th>
                    <th style="width: 5%;">Unit</th>
                    <th style="width: 10%;">Price/ Unit</th>
                    <th style="width: 10%;">GST</th>
                    <th style="width: 10%;">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="text-center">1</td>
                    <td class="bold">
                        {booking.mela_vehicle.model_name if booking.mela_vehicle else (booking.vehicle_model.model_name if booking.vehicle_model else 'Electric Vehicle')}<br/>
                        <span style="font-size: 6px; font-weight: normal; color: #555;">({booking.mela_battery.battery_name if booking.mela_battery else booking.battery_type})</span>
                    </td>
                    <td class="text-center">87116020</td>
                    <td class="text-center">{booking.color or (booking.mela_vehicle.color if booking.mela_vehicle else '')}</td>
                    <td class="text-center">1</td>
                    <td class="text-center">VH</td>
                    <td class="text-right">₹ {taxable:,.2f}</td>
                    <td class="text-center">₹ {gst_total:,.2f} (5%)</td>
                    <td class="text-right bold">₹ {total:,.2f}</td>
                </tr>
            </tbody>
        </table>

        <table class="summary-table">
            <tr>
                <td style="width: 60%;">
                    <span class="bold">Invoice Amount in Words:</span><br/>
                    <span class="bold" style="font-size: 9px; text-transform: capitalize;">{words}</span>
                    <br/><br/>
                    <span class="bold">Description:</span><br/>
                    BATTERY WARRANTY - 3YEARS (or) 30,000KM (Whichever comes first)<br/>
                    MOTOR WARRANTY - 2YEARS<br/>
                    CONTROLLER WARRANTY - 2YEARS<br/>
                    CHARGER WARRANTY - 1YEAR<br/>
                    <span class="bold">NOTE ; NO FREE SERVICES</span>
                    <br/><br/>
                    <span class="bold">Payment mode:</span><br/>
                    {payment_mode_text}
                </td>
                <td style="width: 40%;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="border: none; padding: 2px;" class="bold">Sub Total</td>
                            <td style="border: none; padding: 2px;" class="text-right bold">₹ {total:,.2f}</td>
                        </tr>
                        <tr style="border-top: 1px solid #000;">
                            <td style="border: none; padding: 4px 2px;" class="bold">Total</td>
                            <td style="border: none; padding: 4px 2px;" class="text-right bold">₹ {total:,.2f}</td>
                        </tr>
                        <tr>
                            <td style="border: none; padding: 2px;">Received</td>
                            <td style="border: none; padding: 2px;" class="text-right">₹ {total:,.2f}</td>
                        </tr>
                        <tr style="border-top: 1px solid #ccc;">
                            <td style="border: none; padding: 2px;" class="bold">Balance</td>
                            <td style="border: none; padding: 2px;" class="text-right bold">₹ 0.00</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <table class="tax-table">
            <thead>
                <tr>
                    <th rowspan="2" style="width: 20%;">HSN/ SAC</th>
                    <th rowspan="2" style="width: 20%;">Taxable amount</th>
                    <th colspan="2" style="width: 25%;">CGST</th>
                    <th colspan="2" style="width: 25%;">SGST</th>
                    <th rowspan="2" style="width: 15%;">Total Tax Amount</th>
                </tr>
                <tr>
                    <th>Rate</th>
                    <th>Amount</th>
                    <th>Rate</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="text-center">87116020</td>
                    <td class="text-right">₹ {taxable:,.2f}</td>
                    <td class="text-center">2.5%</td>
                    <td class="text-right">₹ {cgst:,.2f}</td>
                    <td class="text-center">2.5%</td>
                    <td class="text-right">₹ {sgst:,.2f}</td>
                    <td class="text-right bold">₹ {gst_total:,.2f}</td>
                </tr>
                <tr style="background-color: #f2f2f2; font-weight: bold;">
                    <td class="text-center">Total</td>
                    <td class="text-right">₹ {taxable:,.2f}</td>
                    <td colspan="2" class="text-right">₹ {cgst:,.2f}</td>
                    <td colspan="2" class="text-right">₹ {sgst:,.2f}</td>
                    <td class="text-right">₹ {gst_total:,.2f}</td>
                </tr>
            </tbody>
        </table>

        <table class="footer-table">
            <tr>
                <td>
                    <span class="bold">Bank Details</span><br/>
                    Name : ICICI BANK LIMITED, SRIKAKULAM<br/>
                    Account No. : 070005500380<br/>
                    IFSC code : ICIC0000700<br/>
                    Account holder's name : KVR MOTORS
                </td>
                <td>
                    <span class="bold">Terms and conditions</span><br/>
                    Thanks You!<br/>
                    Please Refer to Terms and Conditions in Page 2
                </td>
                <td class="text-center">
                    <span class="bold">For : KVR MOTORS</span>
                    <br/><br/><br/>
                    <span class="bold" style="text-decoration: underline; font-style: italic; font-size: 9px;">K.V. Raghava Reddy</span>
                    <br/><br/>
                    <span class="bold">Proprietor</span>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    # Generate PDF using BytesIO
    pdf_buffer = BytesIO()
    pisa_status = pisa.CreatePDF(BytesIO(html_content.encode("utf-8")), dest=pdf_buffer)
    
    if pisa_status.err:
        raise Exception("Failed to generate PDF invoice via xhtml2pdf")
        
    pdf_buffer.seek(0)
    
    # Save the generated PDF file content
    filename = f"invoice_mela_{booking.booking_id}.pdf"
    booking.invoice_pdf.save(filename, ContentFile(pdf_buffer.read()), save=True)
    return booking.invoice_pdf.url
