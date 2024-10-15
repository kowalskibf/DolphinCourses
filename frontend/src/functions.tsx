function getCSRFToken(): string | null {
    const csrfTokenMatch = document.cookie.match(/csrftoken=([^;]+)/);
    return csrfTokenMatch ? csrfTokenMatch[1] : null;
}


// Zmieniona funkcja makeRequest
export async function makeRequest(
    url: string,
    method: string,
    body?: any,
    includeToken: boolean = true
): Promise<any> {
    // Przygotowanie nagłówków
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    headers['Accept'] = 'application/json';

    // Dodanie tokena CSRF, jeśli metoda to POST, PUT lub DELETE
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
        const csrfToken = getCSRFToken();
        if (csrfToken) {
            headers['X-CSRFToken'] = csrfToken;
        }
    }

    // Dodanie nagłówka Authorization, jeśli wymagany
    if (includeToken) {
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Token ${token}`;
        }
    }

    // Przygotowanie opcji zapytania
    const options: RequestInit = {
        method: method,
        headers: headers,
    };

    // Dodanie body w przypadku zapytań POST, PUT, DELETE
    if (body) {
        options.body = JSON.stringify(body);
    }

    // Wysłanie żądania
    const response = await fetch(url, options);
    const data = await response.json();

    // Zwrócenie odpowiedzi
    return {
        response: data,
        status: response.status,
        message: response.ok ? "Success" : "Error",
    };
};


export const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval > 50) {
        return "Never";
    }
    if (interval >= 1) {
        return interval + " years ago";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
        return interval + " months ago";
    }
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
        return interval + " days ago";
    }
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
        return interval + " hours ago";
    }
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
        return interval + " minutes ago";
    }
    return Math.floor(seconds) + " seconds ago";
};