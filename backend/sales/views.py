from rest_framework import viewsets
from .models import SalesInvoice
from .serializers import SalesInvoiceSerializer
from config.cache import CacheResponseMixin

from rest_framework.decorators import action
from django.http import HttpResponse
import io

class SalesInvoiceViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    serializer_class = SalesInvoiceSerializer
    filterset_fields = ['delivery_status', 'sales_executive', 'branch']

    def get_queryset(self):
        user = self.request.user
        queryset = SalesInvoice.objects.all().order_by('-sale_date')
        if user.is_authenticated and user.role not in ['admin', 'owner']:
            if hasattr(user, 'branch') and user.branch:
                queryset = queryset.filter(branch__name=user.branch)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        extra = {}
        if user.is_authenticated:
            if not serializer.validated_data.get('sales_executive'):
                extra['sales_executive'] = user
        serializer.save(**extra)
        self.clear_cache()

    @action(detail=True, methods=['get'], permission_classes=[])
    def download(self, request, pk=None):
        invoice = self.get_object()
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #333; }}
                .header {{ text-align: center; font-size: 18px; font-weight: bold; color: #04a700; border-bottom: 2px solid #04a700; padding-bottom: 10px; }}
                .details {{ margin-top: 20px; line-height: 1.6; }}
                .table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                .table th, .table td {{ border: 1px solid #ccc; padding: 8px; text-align: left; }}
                .table th {{ background-color: #f5f5f5; font-weight: bold; }}
                .total {{ text-align: right; font-size: 14px; font-weight: bold; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="header">KVR MOTORS - TAX INVOICE</div>
            <div class="details">
                <p><strong>Invoice No:</strong> {invoice.invoice_number}</p>
                <p><strong>Customer Name:</strong> {invoice.customer_name}</p>
                <p><strong>Contact Phone:</strong> {invoice.customer_contact}</p>
                <p><strong>Sale Date:</strong> {invoice.sale_date}</p>
                <p><strong>Branch:</strong> {invoice.branch.name if invoice.branch else 'KVR Motors'}</p>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>Item Description</th>
                        <th>VIN / Chassis</th>
                        <th>Motor No</th>
                        <th>Payment Mode</th>
                        <th>Amount (INR)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{invoice.vehicle_unit.model.model_name if invoice.vehicle_unit and invoice.vehicle_unit.model else 'Electric Vehicle'}</td>
                        <td>{invoice.vehicle_unit.vin_number if invoice.vehicle_unit else '—'}</td>
                        <td>{invoice.vehicle_unit.motor_number if invoice.vehicle_unit else '—'}</td>
                        <td>{invoice.payment_mode}</td>
                        <td>₹ {float(invoice.sale_price):,.2f}</td>
                    </tr>
                </tbody>
            </table>
            <div class="total">
                Total Amount Paid: ₹ {float(invoice.sale_price):,.2f}
            </div>
        </body>
        </html>
        """
        try:
            from xhtml2pdf import pisa
            pdf_buffer = io.BytesIO()
            pisa_status = pisa.CreatePDF(html_content, dest=pdf_buffer)
            if not pisa_status.err:
                response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="{invoice.invoice_number}.pdf"'
                return response
        except Exception as e:
            print("pisa PDF error:", e)
        return HttpResponse(html_content, content_type='text/html')

