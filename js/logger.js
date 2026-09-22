/**
 * Frontend logging module
 * AI Mold Cost Evaluation Agent - logger wrapper
 */

const Logger = (function() {
    const API_BASE = (() => {
        if (window.__API_BASE__) {
            return window.__API_BASE__
        }

        return '/api'
    })()
    const MAX_MESSAGE_LENGTH = 4096
    const LEVELS = ['DEBUG', 'INFO', 'WARNING', 'ERROR']

    /**
     * Get token
     */
    function getToken() {
        return localStorage.getItem('token')
    }

    /**
     * Get current timestamp (ISO format)
     */
    function getTimestamp() {
        return new Date().toISOString()
    }

    /**
     * Send log to backend
     */
    async function sendLog(level, message) {
        // Static GitHub Pages / mock mode: never call a backend logger.
        if (window.__MOCK_MODE__) {
            return false
        }

        const token = getToken()

        try {
            const response = await fetch(`${API_BASE}/logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    level: level,
                    message: message,
                    timestamp: getTimestamp()
                })
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            return true
        } catch (error) {
            // Fall back to console.log on network errors
            console.warn(`[${level}] ${message} (send failed, logged locally)`)
            return false
        }
    }

    /**
     * Format message
     */
    function formatMessage(...args) {
        return args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg)
                } catch {
                    return String(arg)
                }
            }
            return String(arg)
        }).join(' ')
    }

    /**
     * Truncate message
     */
    function truncateMessage(message) {
        if (message.length > MAX_MESSAGE_LENGTH) {
            return message.substring(0, MAX_MESSAGE_LENGTH) + '...'
        }
        return message
    }

    /**
     * Create log method
     */
    function createLogMethod(level) {
        return async function(...args) {
            const message = truncateMessage(formatMessage(...args))

            // Also output to console
            const consoleMethod = level === 'ERROR' ? 'error' :
                                  level === 'WARNING' ? 'warn' : 'log'
            console[consoleMethod](`[${level}]`, ...args)

            // Send to backend
            await sendLog(level, message)
        }
    }

    /**
     * Public API
     */
    return {
        debug: createLogMethod('DEBUG'),
        info: createLogMethod('INFO'),
        warn: createLogMethod('WARNING'),
        error: createLogMethod('ERROR'),

        /**
         * Record user action
         */
        userAction: async function(action, details = {}) {
            const message = `User action: ${action} | ${JSON.stringify(details)}`
            console.log(`[INFO] ${message}`)
            await sendLog('INFO', message)
        },

        /**
         * Record page event
         */
        pageEvent: async function(event, details = {}) {
            const message = `Page event: ${event} | ${JSON.stringify(details)}`
            console.log(`[INFO] ${message}`)
            await sendLog('INFO', message)
        }
    }
})()

// Export Logger object
window.Logger = Logger
