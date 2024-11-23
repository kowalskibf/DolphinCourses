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

export function formatAmount(amount: number): string {
    if (isNaN(amount)) {
        throw new Error("Invalid input: amount must be a number.");
    }

    // Podziel na złote i grosze
    const zl = Math.floor(amount / 100);
    const gr = amount % 100;

    // Zwróć w formacie "1 234,56"
    return `${zl.toLocaleString("pl-PL")},${gr.toString().padStart(2, "0")}`;
}

export function priceToInt(value: string | number): number {
    if (typeof value === 'number') {
        return value * 100;
    }
    value = value.replace(',', '.');
    return Math.round(parseFloat(value) * 100);
}

export function intToPrice(value: number): string {
    const zl = Math.floor(value / 100);
    const gr = value % 100;
    return `${zl},${gr.toString().padStart(2, '0')}`;
}
export function formatDateToBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Miesiące są 0-indeksowane
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; // Możesz dodać strefę czasową, jeśli to potrzebne
}

export const formatDateTimeLocal = (date: Date): string => {
    const isoString = date.toISOString();
    return isoString.substring(0, 16);
};