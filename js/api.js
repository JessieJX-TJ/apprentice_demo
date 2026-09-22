/**
 * API request wrapper
 * AI Mold Cost Evaluation Agent - frontend API module
 */

const API_BASE = (() => {
    if (window.__API_BASE__) {
        return window.__API_BASE__
    }

    // Static / mock deployments never call a real backend.
    // Keep a relative API prefix only for optional local development overrides.
    return '/api'
})()

function getAppHomeUrl() {
    // Prefer the Vite-injected <base> / asset base when present; otherwise stay on current directory.
    try {
        return new URL('.', document.baseURI).href
    } catch (e) {
        return './'
    }
}

/**
 * Get token
 */
function getToken() {
    return localStorage.getItem('token')
}

function parseJwtPayload(token) {
    try {
        const payload = token.split('.')[1]
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
        const decoded = atob(normalized)
        return JSON.parse(decodeURIComponent(escape(decoded)))
    } catch (e) {
        return {}
    }
}

/**
 * Generic request wrapper
 */
async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    }

    const token = getToken()
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        })

        // Handle 401 unauthorized
        if (response.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user_id')
            localStorage.removeItem('username')
            window.location.href = getAppHomeUrl()
            throw new Error('Not signed in or session expired')
        }

        const contentType = response.headers.get('content-type') || ''
        const data = contentType.includes('application/json')
            ? await response.json()
            : { detail: await response.text() }

        // Handle unified backend response {code, data, message}
        if (data.code !== undefined && data.code !== 200) {
            throw new Error(data.message || 'Request failed')
        }

        if (!response.ok) {
            throw new Error(data.detail || data.message || 'Request failed')
        }

        return data
    } catch (error) {
        if (error.message === 'Failed to fetch') {
            throw new Error('Network error; check your connection')
        }
        throw error
    }
}

// ============ Auth API ============

/**
 * User login
 * @param {string} username - username
 * @param {string} password - password
 * @returns {Promise<{token: string, user_id: string, username: string}>}
 */
async function login(username, password) {
    const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    })
    const token = data.data.access_token
    const payload = parseJwtPayload(token)
    // Backend returns {code, data: {access_token, token_type, expires_in}, message}
    // Adapt to frontend-expected format
    return {
        token,
        user_id: data.data.user_id || payload.user_id,
        username: data.data.username || payload.username || username,
        role: data.data.role || payload.role || 'editor'
    }
}

/**
 * User registration
 * @param {string} username - username
 * @param {string} password - password
 * @returns {Promise<{user_id: string, username: string}>}
 */
async function register(username, password) {
    const data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    })
    // Backend returns {code, data: {user_id, username}, message}
    return {
        user_id: data.data.user_id,
        username: data.data.username
    }
}

// ============ Conversation API ============

/**
 * Send chat message
 * @param {string} message - message content
 * @param {string} conversationId - conversation ID (optional)
 * @param {string} moldCategory - mold rule category
 * @returns {Promise<{message: string, conversation_id: string}>}
 */
async function sendMessage(message, conversationId = null, moldCategory = 'injection_mold', mode = null) {
    const body = {
        message,
        mold_category: moldCategory
    }
    if (conversationId) {
        body.conversation_id = conversationId
    }
    // mode: force mode - rag_qa=Knowledge Q&A, quote=Cost Estimation
    if (mode) {
        body.mode = mode
    }
    return request('/chat/', {
        method: 'POST',
        body: JSON.stringify(body)
    })
}

async function listConversations() {
    return request('/chat/conversations', {
        method: 'GET'
    })
}

async function createConversation() {
    return request('/chat/conversations', {
        method: 'POST'
    })
}

async function getConversation(conversationId) {
    return request(`/chat/conversations/${encodeURIComponent(conversationId)}`, {
        method: 'GET'
    })
}

async function deleteConversation(conversationId) {
    return request(`/chat/conversations/${encodeURIComponent(conversationId)}`, {
        method: 'DELETE'
    })
}

async function hitlConfirm(conversationId, confirmed) {
    return request('/chat/hitl-confirm', {
        method: 'POST',
        body: JSON.stringify({
            conversation_id: conversationId,
            confirmed
        })
    })
}

// ============ Knowledge API ============

/**
 * Search knowledge base
 * @param {string} query - search query
 * @returns {Promise<{results: Array}>}
 */
async function searchKnowledge(query) {
    return request(`/knowledge?query=${encodeURIComponent(query)}`, {
        method: 'GET'
    })
}

/**
 * Add knowledge
 * @param {string} content - knowledge content
 * @param {string} type - knowledge type (developer/user/conversation)
 * @param {string} userId - user ID (optional)
 * @param {string} conversationId - conversation ID (optional)
 * @returns {Promise<Object>}
 */
async function addKnowledge(content, type, userId = null, conversationId = null) {
    const body = { content, type }
    if (userId) body.user_id = userId
    if (conversationId) body.conversation_id = conversationId
    return request('/knowledge', {
        method: 'POST',
        body: JSON.stringify(body)
    })
}

/**
 * Delete knowledge
 * @param {string} id - knowledge ID
 * @returns {Promise<Object>}
 */
async function deleteKnowledge(id) {
    return request(`/knowledge/${id}`, {
        method: 'DELETE'
    })
}

// ============ Knowledge file API ============

/**
 * Upload knowledge file
 * @param {File} file - file object
 * @param {Function} onProgress - progress callback (progress) => void
 * @returns {Promise<{file_id: string, filename: string, file_size: number, total_chunks: number, status: string}>}
 */
async function uploadKnowledgeFile(file, onProgress = null) {
    const token = getToken()
    const formData = new FormData()
    formData.append('file', file)

    // 1. Upload file
    const response = await fetch(`${API_BASE}/knowledge/files/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    })

    if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user_id')
        localStorage.removeItem('username')
        window.location.href = getAppHomeUrl()
        throw new Error('Not signed in or session expired')
    }

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.detail || data.message || 'Upload failed')
    }

    // 2. Poll progress
    if (onProgress && data.status === 'processing') {
        const pollInterval = setInterval(async () => {
            try {
                const status = await getUploadStatus(data.file_id)
                onProgress(status)

                if (status.status === 'completed' || status.status === 'failed') {
                    clearInterval(pollInterval)
                }
            } catch (e) {
                console.error('Failed to query progress:', e)
                clearInterval(pollInterval)
            }
        }, 2000)
    }

    return data
}

/**
 * Get file upload progress
 * @param {string} fileId - file ID
 * @returns {Promise<{file_id: string, filename: string, status: string, total_chunks: number, imported_chunks: number, failed_chunks: number}>}
 */
async function getUploadStatus(fileId) {
    const token = getToken()
    const response = await fetch(`${API_BASE}/knowledge/files/upload/${fileId}/status`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user_id')
        localStorage.removeItem('username')
        window.location.href = getAppHomeUrl()
        throw new Error('Not signed in or session expired')
    }

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.detail || 'Query failed')
    }

    return data
}

/**
 * List all knowledge files for the user
 * @param {number} limit - return limit
 * @returns {Promise<{files: Array}>}
 */
async function listKnowledgeFiles(limit = 50) {
    return request(`/knowledge/files?limit=${limit}`, {
        method: 'GET'
    })
}

/**
 * Delete knowledge file
 * @param {string} fileId - file ID
 * @returns {Promise<{message: string}>}
 */
async function deleteKnowledgeFile(fileId) {
    return request(`/knowledge/files/${fileId}`, {
        method: 'DELETE'
    })
}

/**
 * Refresh file access time (extend validity)
 * @param {string} fileId - file ID
 * @returns {Promise<{message: string}>}
 */
async function refreshFileAccess(fileId) {
    return request(`/knowledge/files/${fileId}/refresh`, {
        method: 'POST'
    })
}

async function listFormulaAssets(moldTypeKey) {
    return request(`/skill-evo/formulas?mold_type_key=${encodeURIComponent(moldTypeKey)}`, {
        method: 'GET'
    })
}

async function getFormulaFunctions() {
    return request('/skill-evo/formulas/functions', {
        method: 'GET'
    })
}

async function getFormulaBindingsCatalog(moldTypeKey, executionStage = '') {
    const stageQuery = executionStage ? `&execution_stage=${encodeURIComponent(executionStage)}` : ''
    return request(`/skill-evo/formulas/bindings/catalog?mold_type_key=${encodeURIComponent(moldTypeKey)}${stageQuery}`, {
        method: 'GET'
    })
}

async function validateFormulaAsset(formulaAsset) {
    return request('/skill-evo/formulas/validate', {
        method: 'POST',
        body: JSON.stringify({
            formula_asset: formulaAsset
        })
    })
}

async function evaluateFormulaAsset(payload) {
    return request('/skill-evo/formulas/evaluate', {
        method: 'POST',
        body: JSON.stringify(payload)
    })
}

async function previewFormulaPatch(payload) {
    return request('/skill-evo/formulas/preview-patch', {
        method: 'POST',
        body: JSON.stringify(payload)
    })
}

async function saveFormulaAsset(payload) {
    return request('/skill-evo/formulas', {
        method: 'POST',
        body: JSON.stringify(payload)
    })
}

async function getFormulaVersions(moldTypeKey, targetField) {
    return request(`/skill-evo/formulas/${encodeURIComponent(targetField)}/versions?mold_type_key=${encodeURIComponent(moldTypeKey)}`, {
        method: 'GET'
    })
}

async function rollbackFormulaAsset(payload) {
    return request('/skill-evo/formulas/rollback', {
        method: 'POST',
        body: JSON.stringify(payload)
    })
}

async function getFormulaMemoryInsights(moldTypeKey, targetField = '') {
    const targetQuery = targetField ? `&target_field=${encodeURIComponent(targetField)}` : ''
    return request(`/skill-evo/formulas/memory-insights?mold_type_key=${encodeURIComponent(moldTypeKey)}${targetQuery}`, {
        method: 'GET'
    })
}

// ============ KB Knowledge Base (document parsing)============
function buildKBParseError(response, err, endpoint) {
    if (response.status === 404) {
        return `Backend endpoint ${endpoint} was not found. Confirm this page is connected to the mold_cost_7.2 backend and restart the backend service.`
    }
    return err.detail || err.message || `KB parse failed: ${response.status}`
}

async function parseDocumentToKB(file, moldCategory = 'injection_mold') {
    const token = getToken()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mold_category', moldCategory)
    const response = await fetch(`${API_BASE}/kb/parse-file`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    })
    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: response.statusText }))
        throw new Error(buildKBParseError(response, err, '/api/kb/parse-file'))
    }
    return await response.json()
}

async function parseDocumentsToKB(files, moldCategory = 'injection_mold') {
    const token = getToken()
    const formData = new FormData()
    ;(files || []).forEach(file => formData.append('files', file))
    formData.append('mold_category', moldCategory)
    const response = await fetch(`${API_BASE}/kb/parse-files`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    })
    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: response.statusText }))
        throw new Error(buildKBParseError(response, err, '/api/kb/parse-files'))
    }
    return await response.json()
}

async function getKBParseBatchStatus(batchId) {
    return await request(`/kb/parse-batches/${encodeURIComponent(batchId)}/status`, { method: 'GET' })
}

async function listKBDocuments() {
    return await request('/kb/documents', { method: 'GET' })
}

async function getKBDocument(docId) {
    return await request(`/kb/documents/${encodeURIComponent(docId)}`, { method: 'GET' })
}

async function deleteKBDocument(docId) {
    return await request(`/kb/documents/${encodeURIComponent(docId)}`, { method: 'DELETE' })
}

async function searchKB(query, topK = 5) {
    return await request(`/kb/search?q=${encodeURIComponent(query)}&top_k=${topK}`, { method: 'GET' })
}

async function retrieveKBSummary(summaryId) {
    return await request(`/kb/summaries/${encodeURIComponent(summaryId)}/retrieve`, { method: 'POST' })
}

async function promoteKBSummary(summaryId, reason = 'user_pinned') {
    return await request(`/kb/summaries/${encodeURIComponent(summaryId)}/promote?reason=${encodeURIComponent(reason)}`, {
        method: 'POST'
    })
}

async function pinKBSummary(summaryId) {
    return await request(`/kb/summaries/${encodeURIComponent(summaryId)}/pin`, { method: 'POST' })
}

async function patchKBChunk({ docId, chunkId, beforeText, afterText, reason = 'direct_knowledge_correction' }) {
    return await request(`/kb/chunks/${encodeURIComponent(chunkId)}/patch`, {
        method: 'POST',
        body: JSON.stringify({
            doc_id: docId,
            before_text: beforeText,
            after_text: afterText,
            reason
        })
    })
}

async function adminPatchKBChunk({ docId, chunkId, beforeText, afterText, reason = 'admin_knowledge_correction' }) {
    return await request(`/kb/chunks/${encodeURIComponent(chunkId)}/admin-patch`, {
        method: 'POST',
        body: JSON.stringify({
            doc_id: docId,
            before_text: beforeText,
            after_text: afterText,
            reason
        })
    })
}

async function createAnswerCorrection(payload) {
    return await request('/kb/answer-corrections', {
        method: 'POST',
        body: JSON.stringify(payload || {})
    })
}

async function adminCreateAnswerCorrection(payload) {
    return await request('/kb/answer-corrections/admin', {
        method: 'POST',
        body: JSON.stringify(payload || {})
    })
}

// Export API object (mock mode is injected early by mock-api.js)
if (!window.__MOCK_MODE__) {
window.api = {
    login,
    register,
    sendMessage,
    listConversations,
    createConversation,
    getConversation,
    deleteConversation,
    hitlConfirm,
    searchKnowledge,
    addKnowledge,
    deleteKnowledge,
    uploadKnowledgeFile,
    getUploadStatus,
    listKnowledgeFiles,
    deleteKnowledgeFile,
    refreshFileAccess,
    listFormulaAssets,
    getFormulaFunctions,
    getFormulaBindingsCatalog,
    validateFormulaAsset,
    evaluateFormulaAsset,
    previewFormulaPatch,
    saveFormulaAsset,
    getFormulaVersions,
    rollbackFormulaAsset,
    getFormulaMemoryInsights,
    parseDocumentToKB,
    parseDocumentsToKB,
    getKBParseBatchStatus,
    listKBDocuments,
    getKBDocument,
    deleteKBDocument,
    searchKB,
    retrieveKBSummary,
    promoteKBSummary,
    pinKBSummary,
    patchKBChunk,
    adminPatchKBChunk,
    createAnswerCorrection,
    adminCreateAnswerCorrection
}
}
