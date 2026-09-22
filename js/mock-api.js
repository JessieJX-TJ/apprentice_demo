/**
 * Mock API - local UI demo mode
 * Experience login, chat, cost estimation, and the KB panel without a backend
 */

(function initMockApi() {
    const enabled = window.__MOCK_MODE__ ?? /[?&]mock(?:=1|=true|=yes)?(?:&|$)/i.test(window.location.search)
    if (!enabled) {
        return
    }

    window.__MOCK_MODE__ = true
    try {
        localStorage.removeItem('mold_cost_mock_store_v1')
    } catch (e) {}

    const STORAGE_KEY = 'mold_cost_mock_store_v2'
    const fixtures = window.__MOCK_FIXTURES__ || {}
    const demoCredentials = fixtures.demoCredentials || { username: 'demo', password: 'Demo123' }

    const delay = (ms = 320) => new Promise(resolve => setTimeout(resolve, ms))

    function nowIso() {
        return new Date().toISOString()
    }

    function createId(prefix) {
        return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    }

    function loadStore() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) {
                return JSON.parse(raw)
            }
        } catch (error) {
            console.warn('[mock-api] Failed to read local data; using default demo data', error)
        }
        return createDefaultStore()
    }

    function saveStore(store) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    }

    function createDefaultStore() {
        const userId = 'mock_user_demo'
        const conv1 = createId('conv')
        const conv2 = createId('conv')
        const store = {
            users: {
                [demoCredentials.username]: {
                    user_id: userId,
                    username: demoCredentials.username,
                    password: demoCredentials.password,
                    role: 'admin'
                }
            },
            conversations: {
                [conv1]: {
                    id: conv1,
                    title: 'Injection mold technical requirements',
                    created_at: '2026-07-06T09:10:00.000Z',
                    updated_at: '2026-07-06T09:12:00.000Z',
                    last_message: 'Injection mold design should comprehensively consider cavity count, clamp force, and material shrinkage.',
                    context_summary: 'Knowledge Q&A',
                    messages: [
                        {
                            role: 'user',
                            content: 'What are the technical requirements for an injection mold?',
                            created_at: '2026-07-06T09:10:00.000Z'
                        },
                        {
                            role: 'assistant',
                            content: 'Injection mold design should consider cavity count, clamp force, and material shrinkage. Trials usually prefer a single cavity; production may evaluate multi-cavity layouts for efficiency.',
                            created_at: '2026-07-06T09:12:00.000Z',
                            result: {
                                kb_sources: (fixtures.kbSources || []).slice(0, 1),
                                query: 'What are the technical requirements for an injection mold?'
                            }
                        }
                    ]
                },
                [conv2]: {
                    id: conv2,
                    title: 'Size 140×94×23',
                    created_at: '2026-07-05T15:20:00.000Z',
                    updated_at: '2026-07-05T15:22:00.000Z',
                    last_message: 'Injection mold cost estimation is complete; total mold amount is about 286,800 CNY.',
                    context_summary: 'Cost Estimation',
                    messages: [
                        {
                            role: 'user',
                            content: 'Part size 140 94 23, material 718H, 1 cavity',
                            created_at: '2026-07-05T15:20:00.000Z'
                        },
                        {
                            role: 'assistant',
                            content: 'Injection mold cost estimation is complete; total mold amount is about 286,800 CNY. Material breakdown and surcharges are below — switch materials in the table to see the impact.',
                            created_at: '2026-07-05T15:22:00.000Z',
                            result: cloneQuoteResult()
                        }
                    ]
                }
            },
            kbDocuments: (fixtures.kbDocuments || []).map(doc => ({ ...doc })),
            knowledgeFiles: [],
            uploadTasks: {}
        }
        saveStore(store)
        return store
    }

    function cloneData(value) {
        return JSON.parse(JSON.stringify(value))
    }

    function cloneQuoteResult() {
        return cloneData(fixtures.quoteResult || { mold_price: 286800, calculation_detail: { parts: [] } })
    }

    function createMockToken(user) {
        const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
            user_id: user.user_id,
            username: user.username,
            role: user.role || 'editor'
        }))))
        return `mock.${payload}.demo`
    }

    function getCurrentUser() {
        const username = localStorage.getItem('username')
        if (!username) return null
        const store = loadStore()
        return store.users[username] || null
    }

    function ensureConversation(store, conversationId) {
        if (conversationId && store.conversations[conversationId]) {
            return store.conversations[conversationId]
        }
        const id = conversationId || createId('conv')
        store.conversations[id] = {
            id,
            title: 'New conversation',
            created_at: nowIso(),
            updated_at: nowIso(),
            last_message: '',
            context_summary: '',
            messages: []
        }
        return store.conversations[id]
    }

    function conversationList(store) {
        return Object.values(store.conversations)
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            .map(item => ({
                id: item.id,
                title: item.title,
                last_message: item.last_message,
                context_summary: item.context_summary,
                created_at: item.created_at,
                updated_at: item.updated_at
            }))
    }

    function updateConversationMeta(conversation, message, mode) {
        conversation.updated_at = nowIso()
        conversation.last_message = message
        if (mode === 'quote') {
            conversation.context_summary = 'Cost Estimation'
        } else if (mode === 'rag_qa') {
            conversation.context_summary = 'Knowledge Q&A'
        }
        if (!conversation.title || conversation.title === 'New conversation') {
            conversation.title = message.slice(0, 24)
        }
    }

    function parseDimensions(message) {
        const match = String(message || '').match(/(\d+(?:\.\d+)?)\s*(?:[xX×*]\s*|\s+)(\d+(?:\.\d+)?)\s*(?:[xX×*]\s*|\s+)(\d+(?:\.\d+)?)/)
        if (!match) return null
        return {
            part_length: Number(match[1]),
            part_width: Number(match[2]),
            part_height: Number(match[3])
        }
    }

    function buildRagReply(message) {
        const text = String(message || '')
        if (/718H|P20|S136|Material|unit price/.test(text)) {
            return {
                message: 'Per the knowledge base, 718H mold steel is about 45 CNY/kg, P20 about 28 CNY/kg, and S136 about 68 CNY/kg. Final quotes also depend on part size, cavity count, and surface requirements.',
                result: {
                    query: text,
                    kb_sources: cloneData(fixtures.kbSources || [])
                }
            }
        }
        if (/cavity|multi-cavity|layout|arrangement/i.test(text)) {
            return {
                message: 'Cavity count should match volume targets and mold life. Single cavity suits trial validation; 2+ cavities raise capacity but add complexity and material cost. Common layouts are by length, by width, or length×width.',
                result: {
                    query: text,
                    kb_sources: cloneData((fixtures.kbSources || []).slice(0, 1))
                }
            }
        }
        return {
            message: 'This is a simulated demo reply. Related snippets were retrieved from the local mock knowledge base: injection mold design should consider cavity count, clamp force, material shrinkage, and surface requirements. A real backend returns full RAG results.',
            result: {
                query: text,
                kb_sources: cloneData(fixtures.kbSources || [])
            }
        }
    }

    function buildQuoteReply(message) {
        const dims = parseDimensions(message) || { part_length: 140, part_width: 94, part_height: 23 }
        const result = cloneQuoteResult()
        result.calculation_detail.part_length = dims.part_length
        result.calculation_detail.part_width = dims.part_width
        result.calculation_detail.part_height = dims.part_height
        const sizeText = `${dims.part_length} × ${dims.part_width} × ${dims.part_height}`
        return {
            message: `Injection mold cost estimation for part size ${sizeText} mm is complete (demo data). Total mold amount is about ${Number(result.mold_price || 0).toLocaleString('en-US')} CNY. See material breakdown and surcharges in the table below.`,
            result
        }
    }

    function buildHitlReply(message, conversationId) {
        const result = cloneQuoteResult()
        result.calculation_detail.difficulty_factor = 1.12
        result.mold_price = Math.round(result.mold_price * 1.08)
        result.hitl_confirmation = {
            confirm_question: 'It looks like you want to adjust the difficulty factor. Change it from 1.05 to 1.12 and update the quote?',
            message: 'Parameter change confirmation',
            target_field: 'difficulty_factor',
            old_value: 1.05,
            new_value: 1.12,
            reflection: 'From the conversation context, you mentioned rule-adjustment keywords. Demo mode simulates an HITL parameter confirmation; confirming updates the quote.'
        }
        return {
            message: 'Rule-change intent detected. Generating a preview — confirm whether to apply the new difficulty factor.',
            second_message: result.hitl_confirmation.confirm_question,
            result
        }
    }

    function buildMockReply(message, mode, conversationId) {
        const normalizedMode = mode === 'quote' ? 'quote' : 'rag_qa'
        const text = String(message || '')

        if (normalizedMode === 'quote' && /(modify|change|update|set|set to|adjust)/i.test(text)) {
            return buildHitlReply(text, conversationId)
        }
        if (normalizedMode === 'quote') {
            return buildQuoteReply(text)
        }
        return buildRagReply(text)
    }

    window.api = {
        async login(username, password) {
            await delay()
            if (!String(username || '').length || !String(password || '').length) {
                throw new Error('Please enter username and password')
            }

            const store = loadStore()
            let user = store.users[username]
            if (!user) {
                user = {
                    user_id: createId('user'),
                    username,
                    password,
                    role: 'admin'
                }
                store.users[username] = user
                saveStore(store)
            }

            return {
                token: createMockToken(user),
                user_id: user.user_id,
                username: user.username,
                role: user.role || 'editor'
            }
        },

        async register(username, password) {
            await delay()
            const store = loadStore()
            if (store.users[username]) {
                throw new Error('Username already exists')
            }
            const user = {
                user_id: createId('user'),
                username,
                password,
                role: 'editor'
            }
            store.users[username] = user
            saveStore(store)
            return { user_id: user.user_id, username: user.username }
        },

        async sendMessage(message, conversationId = null, moldCategory = 'injection_mold', mode = null) {
            await delay(480)
            const store = loadStore()
            const conversation = ensureConversation(store, conversationId)
            const selectedMode = mode === 'quote' ? 'quote' : 'rag_qa'
            const reply = buildMockReply(message, selectedMode, conversation.id)

            conversation.messages.push({
                role: 'user',
                content: message,
                created_at: nowIso()
            })
            conversation.messages.push({
                role: 'assistant',
                content: reply.message,
                created_at: nowIso(),
                result: reply.result || null
            })
            updateConversationMeta(conversation, reply.message, selectedMode)
            saveStore(store)

            return {
                conversation_id: conversation.id,
                message: reply.message,
                second_message: reply.second_message,
                result: reply.result
            }
        },

        async listConversations() {
            await delay(180)
            const store = loadStore()
            return { conversations: conversationList(store) }
        },

        async createConversation() {
            await delay(120)
            const store = loadStore()
            const conversation = ensureConversation(store, null)
            saveStore(store)
            return { id: conversation.id }
        },

        async getConversation(conversationId) {
            await delay(220)
            const store = loadStore()
            const conversation = store.conversations[conversationId]
            if (!conversation) {
                throw new Error('Conversation not found')
            }
            return cloneData(conversation)
        },

        async deleteConversation(conversationId) {
            await delay(180)
            const store = loadStore()
            delete store.conversations[conversationId]
            saveStore(store)
            return { message: 'Deleted' }
        },

        async hitlConfirm(conversationId, confirmed) {
            await delay(260)
            const store = loadStore()
            const conversation = store.conversations[conversationId]
            if (!conversation) {
                throw new Error('Conversation not found')
            }
            const result = cloneQuoteResult()
            if (confirmed) {
                result.calculation_detail.difficulty_factor = 1.12
                result.mold_price = Math.round(result.mold_price * 1.08)
                result.hitl_confirmation = { confirmed: true, cancelled: false }
                return {
                    message: 'Change confirmed. Difficulty factor updated to 1.12 and the quote recalculated (demo data).',
                    result
                }
            }
            result.hitl_confirmation = { confirmed: false, cancelled: true }
            return {
                message: 'Change cancelled. The original quote is kept (demo data).',
                result
            }
        },

        async searchKnowledge(query) {
            await delay()
            return { results: cloneData(fixtures.kbSources || []) }
        },

        async addKnowledge() {
            await delay()
            return { message: 'Demo mode: knowledge simulated as saved' }
        },

        async deleteKnowledge() {
            await delay()
            return { message: 'Demo mode: knowledge simulated as deleted' }
        },

        async uploadKnowledgeFile(file, onProgress = null) {
            await delay(200)
            const fileId = createId('file')
            const record = {
                id: fileId,
                original_filename: file?.name || 'demo.pdf',
                file_size: file?.size || 1024,
                file_type: 'pdf',
                status: 'processing',
                created_at: nowIso(),
                total_chunks: 12,
                imported_chunks: 0
            }
            const store = loadStore()
            store.knowledgeFiles.unshift(record)
            store.uploadTasks[fileId] = record
            saveStore(store)

            if (onProgress) {
                onProgress({ ...record, imported_chunks: 0 })
                setTimeout(() => onProgress({ ...record, status: 'processing', imported_chunks: 6 }), 400)
                setTimeout(() => onProgress({ ...record, status: 'completed', imported_chunks: 12 }), 900)
            }

            setTimeout(() => {
                const latest = loadStore()
                const task = latest.uploadTasks[fileId]
                if (task) {
                    task.status = 'completed'
                    task.imported_chunks = 12
                    saveStore(latest)
                }
            }, 1000)

            return { ...record, file_id: fileId }
        },

        async getUploadStatus(fileId) {
            await delay(120)
            const store = loadStore()
            const task = store.uploadTasks[fileId]
            if (!task) {
                throw new Error('Upload task not found')
            }
            return {
                file_id: fileId,
                filename: task.original_filename,
                status: task.status,
                total_chunks: task.total_chunks,
                imported_chunks: task.imported_chunks,
                failed_chunks: 0
            }
        },

        async listKnowledgeFiles(limit = 50) {
            await delay()
            const store = loadStore()
            return { files: store.knowledgeFiles.slice(0, limit) }
        },

        async deleteKnowledgeFile(fileId) {
            await delay()
            const store = loadStore()
            store.knowledgeFiles = store.knowledgeFiles.filter(item => item.id !== fileId)
            delete store.uploadTasks[fileId]
            saveStore(store)
            return { message: 'Deleted' }
        },

        async refreshFileAccess() {
            await delay()
            return { message: 'Refreshed' }
        },

        async listFormulaAssets() {
            await delay()
            return { formulas: [] }
        },

        async getFormulaFunctions() {
            await delay()
            return { functions: [] }
        },

        async getFormulaBindingsCatalog() {
            await delay()
            return { bindings: [] }
        },

        async validateFormulaAsset() {
            await delay()
            return { valid: true }
        },

        async evaluateFormulaAsset() {
            await delay()
            return { value: 0 }
        },

        async previewFormulaPatch() {
            await delay()
            return { preview: {} }
        },

        async saveFormulaAsset() {
            await delay()
            return { message: 'Demo mode: formula simulated as saved' }
        },

        async getFormulaVersions() {
            await delay()
            return { versions: [] }
        },

        async rollbackFormulaAsset() {
            await delay()
            return { message: 'Demo mode: rollback simulated' }
        },

        async getFormulaMemoryInsights() {
            await delay()
            return { insights: [] }
        },

        async parseDocumentToKB(file, moldCategory = 'injection_mold') {
            return this.parseDocumentsToKB([file], moldCategory)
        },

        async parseDocumentsToKB(files, moldCategory = 'injection_mold') {
            await delay(240)
            const batchId = createId('batch')
            const tasks = (files || []).map(file => ({
                filename: file?.name || 'demo.pdf',
                status: 'processing',
                merged_chunks: 0,
                stats: { merged_chunks: 0 }
            }))
            const store = loadStore()
            store.uploadTasks[batchId] = {
                batch_id: batchId,
                batch_status: 'processing',
                completed: 0,
                failed: 0,
                tasks,
                created_at: nowIso()
            }
            saveStore(store)
            return {
                batch_id: batchId,
                batch_status: 'processing',
                completed: 0,
                failed: 0,
                tasks
            }
        },

        async getKBParseBatchStatus(batchId) {
            await delay(160)
            const store = loadStore()
            const batch = store.uploadTasks[batchId]
            if (!batch) {
                return {
                    batch_id: batchId,
                    batch_status: 'completed',
                    completed: (fixtures.kbDocuments || []).length,
                    failed: 0,
                    tasks: (fixtures.kbDocuments || []).map(doc => ({
                        filename: doc.filename,
                        status: 'completed',
                        merged_chunks: doc.chunk_count || 6,
                        stats: { merged_chunks: doc.chunk_count || 6 }
                    }))
                }
            }

            const elapsed = Date.now() - new Date(batch.created_at || nowIso()).getTime()
            if (elapsed > 1200) {
                batch.batch_status = 'completed'
                batch.completed = batch.tasks.length
                batch.failed = 0
                batch.tasks = batch.tasks.map((task, index) => ({
                    ...task,
                    status: 'completed',
                    merged_chunks: 6 + index * 2,
                    stats: { merged_chunks: 6 + index * 2 }
                }))
                saveStore(store)
            }
            return cloneData(batch)
        },

        async listKBDocuments() {
            await delay()
            const store = loadStore()
            return { documents: cloneData(store.kbDocuments) }
        },

        async getKBDocument(docId) {
            await delay()
            const store = loadStore()
            const doc = store.kbDocuments.find(item => item.doc_id === docId)
            if (!doc) {
                throw new Error('Document not found')
            }
            return {
                ...doc,
                chunks: [
                    {
                        chunk_id: 'mock_chunk_preview_001',
                        summary_cn: 'Demo snippet: Injection mold design spec summary',
                        text: 'Injection mold design should comprehensively consider cavity count, clamp force, material shrinkage, and ejection method.',
                        page_id: '12',
                        structured_table: { records: [] }
                    }
                ]
            }
        },

        async deleteKBDocument(docId) {
            await delay()
            const store = loadStore()
            store.kbDocuments = store.kbDocuments.filter(item => item.doc_id !== docId)
            saveStore(store)
            return { message: 'Deleted' }
        },

        async searchKB(query, topK = 5) {
            await delay()
            return { results: cloneData(fixtures.kbSources || []).slice(0, topK) }
        },

        async retrieveKBSummary() {
            await delay()
            return { text: 'Demo summary' }
        },

        async promoteKBSummary() {
            await delay()
            return { message: 'Promoted' }
        },

        async pinKBSummary() {
            await delay()
            return { message: 'Pinned' }
        },

        async patchKBChunk(payload) {
            await delay()
            return { message: 'Demo mode: knowledge chunk simulated as patched', ...payload }
        },

        async adminPatchKBChunk(payload) {
            await delay()
            return { message: 'Demo mode: admin patch simulated as saved', ...payload }
        },

        async createAnswerCorrection(payload) {
            await delay()
            return { message: 'Demo mode: answer correction simulated as saved', correction_id: createId('corr'), ...payload }
        },

        async adminCreateAnswerCorrection(payload) {
            await delay()
            return { message: 'Demo mode: admin answer correction simulated as saved', correction_id: createId('corr'), ...payload }
        }
    }

    console.info('[mock-api] Demo mode enabled; using local mock data')
})()
