export const PRODUCTION_API = 'https://artisandevs.duckdns.org';
export const LOCAL_API = 'http://localhost:8090';

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]', '::1'];

// The API URL for the host that serves the app (ACC-12). `location.hostname` gives `[::1]` for IPv6.
export const apiUrl = (hostname) => (LOCAL_HOSTS.includes(hostname) ? LOCAL_API : PRODUCTION_API);
