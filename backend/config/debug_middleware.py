class DebugMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if 'leads' in request.path or 'vehicle-models' in request.path:
            print(f"DEBUG MIDDLEWARE: Path: {request.path}, Method: {request.method}")
            print(f"DEBUG MIDDLEWARE: Auth Header: {request.headers.get('Authorization')}")
        response = self.get_response(request)
        if 'leads' in request.path or 'vehicle-models' in request.path:
            print(f"DEBUG MIDDLEWARE: Response status: {response.status_code}")
        return response
