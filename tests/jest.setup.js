// Mock chrome extension API
global.chrome = {
    runtime: {
        sendMessage: jest.fn(),
        getURL: jest.fn(),
        onMessage: {
            addListener: jest.fn()
        }
    },
    tabs: {
        query: jest.fn(),
        create: jest.fn()
    }
};

// Mock window.location
Object.defineProperty(window, 'location', {
    value: {
        href: 'https://example.com',
        pathname: '/',
        search: '',
        hash: ''
    },
    writable: true
});

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn(),
    removeItem: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn(),
    removeItem: jest.fn()
};
global.sessionStorage = sessionStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Reset all mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});
