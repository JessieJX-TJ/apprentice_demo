/**
 * Application logic
 * AI Mold Cost Evaluation Agent - frontend main module
 */

// ============ State ============
let currentUser = null
let conversationId = null
let isRegisterMode = false
let chatHistory = []  // current conversation history (last 10)
const MAX_HISTORY = 10  // keep at most 10 messages
const MAX_KB_BATCH_FILES = 8
let messageSeq = Date.now()
let materialPriceTable = {}
let currentChatMode = 'rag_qa'  // current chat mode: rag_qa | quote
let conversations = []
let isConversationSwitching = false
const WELCOME_MESSAGE = 'Hello, I am the Mold Cost Evaluation Agent. Provide part dimensions, materials, mold type, or a knowledge-base question, and I will help with analysis and cost estimation.'


const LEGACY_CHINESE_PART_NAME_MAP = {
    '定模仁': 'Cavity Insert',
    '动模仁': 'Core Insert',
    '定模板': 'Cavity Plate',
    '动模板': 'Core Plate',
    '顶板': 'Top Plate',
    '热流道固定板': 'Hot Runner Plate',
    '热流道板': 'Hot Runner Plate',
    '顶出板1': 'Ejector Plate 1',
    '顶出板2': 'Ejector Plate 2',
    '模脚': 'Mold Foot',
    '底板': 'Bottom Plate'
}

const LEGACY_CHINESE_UI_REPLACEMENTS = [
    ['AI模具成本评估智能体', 'AI Mold Cost Evaluation Agent'],
    ['模具成本评估智能体', 'Mold Cost Evaluation Agent'],
    ['注塑模具规则', 'Injection Mold Rules'],
    ['金属冲压模具规则', 'Metal Stamping Die Rules'],
    ['铸造类模具规则', 'Casting Mold Rules'],
    ['锻造模具规则', 'Forging Die Rules'],
    ['橡胶模具规则', 'Rubber Mold Rules'],
    ['注塑模具设计规范', 'Injection Mold Design Spec'],
    ['注塑模具技术要求', 'Injection mold technical requirements'],
    ['模具材料单价表', 'Mold Material Unit Price Table'],
    ['注塑模具', 'Injection Mold'],
    ['金属冲压模具', 'Metal Stamping Die'],
    ['铸造类模具', 'Casting Mold'],
    ['锻造模具', 'Forging Die'],
    ['橡胶模具', 'Rubber Mold'],
    ['知识问答', 'Knowledge Q&A'],
    ['成本核算结果', 'Cost estimation result'],
    ['成本核算', 'Cost Estimation'],
    ['新对话', 'New conversation'],
    ['暂无消息', 'No messages yet'],
    ['暂无历史对话', 'No conversation history'],
    ['小徒弟', 'Little Apprentice'],
    ['模具总金额', 'Total mold amount'],
    ['材料费合计', 'Material cost subtotal'],
    ['材料费明细', 'Material cost breakdown'],
    ['附加费用', 'Surcharges'],
    ['计算参数', 'Calculation parameters'],
    ['展开公式', 'Expand formulas'],
    ['收起公式', 'Collapse formulas'],
    ['选择材料', 'Select material'],
    ['未配置', 'Not configured'],
    ['未知材料', 'Unknown material'],
    ['技术要求', 'technical requirements'],
    ['材料单价', 'Material unit price'],
    ['定模仁', 'Cavity Insert'],
    ['动模仁', 'Core Insert'],
    ['定模板', 'Cavity Plate'],
    ['动模板', 'Core Plate'],
    ['顶板', 'Top Plate'],
    ['热流道固定板', 'Hot Runner Plate'],
    ['顶出板1', 'Ejector Plate 1'],
    ['顶出板2', 'Ejector Plate 2'],
    ['模脚', 'Mold Foot'],
    ['底板', 'Bottom Plate'],
    ['元/kg', ' CNY/kg'],
    ['元/点', ' CNY/point'],
    ['元/个', ' CNY/pc'],
    ['元/cm²', ' CNY/cm²'],
    ['万元', ' ×10k CNY']
]

function localizeLegacyChineseText(text) {
    if (text === undefined || text === null) return ''
    let out = String(text)
    LEGACY_CHINESE_UI_REPLACEMENTS.forEach(([from, to]) => {
        if (out.includes(from)) out = out.split(from).join(to)
    })
    return out
}

function localizePartDisplayName(name) {
    const raw = String(name || '').trim()
    if (!raw) return ''
    return LEGACY_CHINESE_PART_NAME_MAP[raw] || localizeLegacyChineseText(raw) || raw
}


const FORMULA_DISPLAY_NAME_MAP = {
    part_length: 'Part length',
    part_width: 'Part width',
    part_height: 'Part height',
    cavity_count: 'Cavity count',
    cavity_spacing: 'Cavity spacing',
    cavity_length: 'Cavity Insert length',
    cavity_width: 'Cavity Insert width',
    cavity_height: 'Cavity Insert height',
    core_length: 'Core Insert length',
    core_width: 'Core Insert width',
    core_height: 'Core Insert height',
    fix_plate_length: 'Cavity Plate length',
    fix_plate_width: 'Cavity Plate width',
    fix_plate_height: 'Cavity Plate height',
    move_plate_length: 'Core Plate length',
    move_plate_width: 'Core Plate width',
    move_plate_height: 'Core Plate height',
    top_plate_length: 'Top Plate length',
    top_plate_width: 'Top Plate width',
    top_plate_height: 'Top Plate height',
    hotrunner_plate_length: 'Hot Runner Plate length',
    hotrunner_plate_width: 'Hot Runner Plate width',
    hotrunner_plate_height: 'Hot Runner Plate height',
    ejector_plate1_length: 'Ejector Plate 1 length',
    ejector_plate1_width: 'Ejector Plate 1 width',
    ejector_plate1_height: 'Ejector Plate 1 height',
    ejector_plate2_length: 'Ejector Plate 2 length',
    ejector_plate2_width: 'Ejector Plate 2 width',
    ejector_plate2_height: 'Ejector Plate 2 height',
    mold_foot_length: 'Mold Foot length',
    mold_foot_width: 'Mold Foot width',
    mold_foot_height: 'Mold Foot height',
    bottom_plate_length: 'Bottom Plate length',
    bottom_plate_width: 'Bottom Plate width',
    bottom_plate_height: 'Bottom Plate height',
    material_fees: 'All material costs',
    material_total: 'Material cost total',
    total_weight: 'Total weight',
    material_ratio: 'Material ratio',
    extra_fee_total: 'Surcharge total',
    difficulty_factor: 'Difficulty factor',
    electrode_cost: 'Electrode cost',
    electrode_weight: 'Electrode weight',
    electrode_unit_price: 'Electrode unit price',
    slider_cost: 'Slider cost',
    slider_ratio: 'Slider ratio',
    hotrunner_cost: 'Hot runner cost',
    hotrunner_points: 'Hot runner points',
    hotrunner_point_cost: 'Hot runner cost per point',
    polishing_cost: 'High-gloss/polish cost',
    polishing_unit_price: 'High-gloss/polish unit price',
    texture_cost: 'Texture cost',
    texture_unit_price: 'Texture unit price',
    oil_cylinder_cost: 'Oil cylinder cost',
    oil_cylinder_count: 'Oil cylinder count',
    oil_cylinder_unit_price: 'Oil cylinder unit price',
    standard_parts_cost: 'Standard parts cost',
    standard_parts_base: 'Material cost total×Standard parts ratio',
    standard_parts_ratio: 'Standard parts ratio',
    other_cost: 'Other costs',
    surface_area_cm2: 'Surface area',
    cavity_material_cost: 'Cavity Insert material cost',
    has_slider: 'Has slider',
    surface_high_gloss_enabled: 'High-gloss/polish enabled',
    surface_texture_enabled: 'Texture enabled',
    other_cost_base: 'Other cost baseline',
    surface_requirement: 'Surface requirement',
    cavity_arrangement: 'Cavity arrangement'
}

const FORMULA_FUNCTION_NAME_MAP = {
    max: 'max',
    min: 'min',
    avg: 'average',
    mean: 'average',
    average: 'average',
    variance: 'variance',
    std: 'std dev',
    sqrt: 'square root',
    pow: 'power',
    sum: 'sum',
    lookup: 'lookup',
    iif: 'Conditional',
    and: 'and',
    or: 'or'
}

const FORMULA_SOURCE_NAME_MAP = {
    manual: 'Manually confirmed rule',
    formula_memory: 'Long-term memory rule',
    default_migrated: 'System default rule',
    system_default: 'System default formula',
    template_override: 'Template override value',
    formula_asset: 'Formula asset',
    runtime: 'Runtime rule'
}

const USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{2,19}$/
const PASSWORD_HAS_LETTER = /[A-Za-z]/
const PASSWORD_HAS_DIGIT = /\d/
const USERNAME_RULE_MESSAGE = 'Username must be 3–20 characters, start with a letter, and may include digits and underscores'
const PASSWORD_RULE_MESSAGE = 'Password must be 6–20 characters and include both letters and digits'

const CALCULATION_PARAMETER_FIELDS = new Set([
    'material_ratio',
    'difficulty_factor',
    'cavity_count',
    'cavity_arrangement',
    'cavity_spacing',
    'hotrunner_points',
    'hotrunner_point_cost',
    'electrode_weight',
    'electrode_unit_price',
    'surface_area_cm2',
    'polishing_unit_price',
    'texture_unit_price',
    'oil_cylinder_count',
    'oil_cylinder_unit_price',
    'standard_parts_ratio',
    'surface_requirement',
    'has_slider'
])

const FORMULA_RATIO_FIELDS = new Set([
    'material_ratio',
    'standard_parts_ratio'
])

const HIDDEN_FORMULA_TRACE_FIELDS = new Set([
    'electrode_weight_formula',
    'snapshot__electrode_weight_formula'
])

const MOLD_TYPE_DISPLAY_NAME_MAP = {
    injection: 'Injection Mold',
    injection_mold: 'Injection Mold',
    acc_cover: 'ACC Cover Injection Mold',
    stamping_mold: 'Metal Stamping Die',
    casting_mold: 'Casting Mold',
    forging_mold: 'Forging Die',
    rubber_mold: 'Rubber Mold'
}

// ============ DOM elements ============
let lastHITLResult = null
let isWelcomeMode = false

const loginPage = document.getElementById('login-page')
const chatPage = document.getElementById('chat-page')
const chatContainer = document.querySelector('.chat-container')
const loginForm = document.getElementById('login-form')
const usernameInput = document.getElementById('username')
const passwordInput = document.getElementById('password')
const loginBtn = document.getElementById('login-btn')
const toggleAuthLink = document.getElementById('toggle-auth-link')
const toggleAuthText = document.getElementById('toggle-auth')
const loginError = document.getElementById('login-error')
const authLoginTab = document.getElementById('auth-login-tab')
const authRegisterTab = document.getElementById('auth-register-tab')
const passwordToggle = document.getElementById('password-toggle')
const rememberUsername = document.getElementById('remember-username')
const usernameHint = document.getElementById('username-hint')
const passwordHint = document.getElementById('password-hint')
const passwordStrength = document.getElementById('password-strength')
const passwordStrengthText = document.getElementById('password-strength-text')
const usernameDisplay = document.getElementById('username-display')
const userAccountMenu = document.getElementById('user-account-menu')
const userAccountDropdown = document.getElementById('user-account-dropdown')
const userAccountName = document.getElementById('user-account-name')
const userAccountRole = document.getElementById('user-account-role')
const userAccountAvatar = document.getElementById('user-account-avatar')
const sidebarUserAvatar = document.getElementById('sidebar-user-avatar')
const sidebarUserName = document.getElementById('sidebar-user-name')
const sidebarUserRole = document.getElementById('sidebar-user-role')
const switchAccountBtn = document.getElementById('switch-account-btn')
const logoutBtn = document.getElementById('logout-btn')
const chatMessages = document.getElementById('chat-messages')
const chatInput = document.getElementById('chat-input')
const sendBtn = document.getElementById('send-btn')
const expandInputBtn = document.getElementById('expand-input-btn')
const attachFileBtn = document.getElementById('attach-file-btn')
const voiceBtn = document.getElementById('voice-btn')
const fileBtn = document.getElementById('file-btn')
const moldCategorySelect = document.getElementById('mold-category-select')
const moldCategoryMenu = document.getElementById('mold-category-menu')
const moldCategoryDropdown = document.getElementById('mold-category-dropdown')
const moldCategoryLabel = document.getElementById('mold-category-label')
const welcomeRuleChips = document.getElementById('welcome-rule-chips')
const chatSessionTitle = document.getElementById('chat-session-title')
const filePanel = document.getElementById('file-panel')
const closeFilePanel = document.getElementById('close-file-panel')
const fileInput = document.getElementById('file-input')
const selectFileBtn = document.getElementById('select-file-btn')
const fileUploadArea = document.getElementById('file-upload-area')
const uploadProgress = document.getElementById('upload-progress')
const progressFilename = document.getElementById('progress-filename')
const progressStatus = document.getElementById('progress-status')
const progressFill = document.getElementById('progress-fill')
const progressImported = document.getElementById('progress-imported')
const progressTotal = document.getElementById('progress-total')
const progressFileList = document.getElementById('progress-file-list')
const fileList = document.getElementById('file-list')
const conversationList = document.getElementById('conversation-list')
const conversationCount = document.getElementById('conversation-count')
const historySearchInput = document.getElementById('history-search-input')
const newConversationBtn = document.getElementById('new-conversation-btn')
const newbieGuideBtn = document.getElementById('newbie-guide-btn')
const newbieGuidePanel = document.getElementById('newbie-guide-panel')
const closeNewbieGuideBtn = document.getElementById('close-newbie-guide')
const newbieGuideConfirmBtn = document.getElementById('newbie-guide-confirm')

// ============ Page init ============
function init() {
    Logger.info('App initializing')
    // Bust pre-translation Chinese mock/history caches once
    if (!localStorage.getItem('ui_lang_en_v2')) {
        localStorage.removeItem('mold_cost_mock_store_v1')
        localStorage.removeItem('mold_cost_mock_store_v2')
        localStorage.removeItem('ui_lang_en_v1')
        Object.keys(localStorage).forEach(key => {
            if (key === 'chat_history' || key.startsWith('chat_history_')) {
                localStorage.removeItem(key)
            }
        })
        localStorage.setItem('ui_lang_en_v2', '1')
        // Reload so mock-api rebuilds English demo data after clearing the store
        if (window.__MOCK_MODE__) {
            location.reload()
            return
        }
    }


    const savedMoldCategory = localStorage.getItem('mold_category') || 'injection_mold'
    setSelectedMoldCategory(savedMoldCategory)

    Logger.info('Showing login page')
    showLoginPage()

    restoreRememberedUsername()
    updateAuthFieldFeedback()

    // Bind events
    bindEvents()
}

// ============ Page switch ============
function showLoginPage() {
    loginPage.classList.remove('hidden')
    chatPage.classList.add('hidden')
    clearAuthValidation()
    restoreRememberedUsername()
    setTimeout(() => {
        const target = usernameInput.value ? passwordInput : usernameInput
        target?.focus()
    }, 0)
}

// ============ Chat mode switch ============
function setChatMode(mode) {
    currentChatMode = mode === 'quote' ? 'quote' : 'rag_qa'
    // Update button state
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'))
    const activeBtnId = currentChatMode === 'rag_qa' ? 'mode-rag' : 'mode-quote'
    const activeBtn = document.getElementById(activeBtnId)
    if (activeBtn) {
        activeBtn.classList.add('active')
    }
    // Update input placeholder
    if (currentChatMode === 'rag_qa') {
        chatInput.placeholder = 'Enter a Knowledge Q&A question, e.g.: What are the technical requirements for an injection mold?'
    } else if (currentChatMode === 'quote') {
        chatInput.placeholder = 'Enter part parameters for Cost Estimation, e.g.: part size 140 94 23'
    }
    Logger.info('Switch chat mode', { mode: currentChatMode })
}

// ============ Chat history ============
function getCurrentUserHistoryKey() {
    return currentUser?.user_id || currentUser?.username || localStorage.getItem('user_id') || localStorage.getItem('username') || 'anonymous'
}

function getHistoryStorageKey(targetConversationId = conversationId) {
    const convKey = targetConversationId || 'draft'
    return `chat_history_${getCurrentUserHistoryKey()}_${convKey}`
}

function loadChatHistory() {
    try {
        const saved = localStorage.getItem(getHistoryStorageKey())
        if (saved) {
            chatHistory = JSON.parse(saved)
            // Restore display
            chatHistory.forEach(msg => {
                if (!msg.id) {
                    msg.id = createMessageId()
                }
                addMessage(msg.role, msg.content, false, msg.result, msg.id, msg.createdAt)
            })
            persistHistory()
            // Restore conversationId
            if (chatHistory.length > 0) {
                const lastWithConvId = [...chatHistory].reverse().find(m => m.conversationId)
                if (lastWithConvId) {
                    conversationId = lastWithConvId.conversationId
                }
            }
            Logger.info('Chat history loaded', { count: chatHistory.length })
        }
    } catch (e) {
        Logger.error('Failed to load chat history', { error: e.message })
        chatHistory = []
    }
}

function createMessageId() {
    messageSeq += 1
    return `msg_${messageSeq}`
}

function trimChatHistory() {
    if (chatHistory.length > MAX_HISTORY) {
        chatHistory = chatHistory.slice(-MAX_HISTORY)
    }
}

function saveChatHistory(role, content, result = null, messageId = null, createdAt = null) {
    const id = messageId || createMessageId()
    chatHistory.push({
        id,
        role,
        content,
        conversationId,
        result,
        createdAt: createdAt || new Date().toISOString()
    })

    trimChatHistory()
    persistHistory()
    return id
}

function clearChatHistory(options = {}) {
    const allForUser = Boolean(options?.allForUser)
    chatHistory = []
    if (allForUser) {
        const prefix = `chat_history_${getCurrentUserHistoryKey()}_`
        Object.keys(localStorage).forEach(key => {
            if (key === 'chat_history' || key.startsWith(prefix)) {
                localStorage.removeItem(key)
            }
        })
        return
    }
    localStorage.removeItem(getHistoryStorageKey())
    localStorage.removeItem('chat_history')
}

function updateHistoryConversationId(convId) {
    // Update conversationId on all messages in history
    chatHistory = chatHistory.map(msg => ({ ...msg, conversationId: convId }))
    persistHistory()
}

function renderWelcomeMessage() {
    addMessage('assistant', WELCOME_MESSAGE, false)
}

function setWelcomeMode(enabled) {
    isWelcomeMode = Boolean(enabled)
    chatContainer?.classList.toggle('is-welcome', isWelcomeMode)
    if (isWelcomeMode) {
        collapseChatInputBox()
        setTimeout(() => {
            chatInput?.focus()
        }, 0)
    } else {
        collapseChatInputBox()
    }
}

function getChatInputBox() {
    return chatInput?.closest('.chat-input-box') || document.querySelector('.chat-input-box')
}

function expandChatInputBox() {
    const inputBox = getChatInputBox()
    if (!inputBox || chatContainer?.classList.contains('is-welcome')) return
    inputBox.classList.add('is-expanded')
    syncExpandInputButton(true)
    chatInput?.focus()
}

function collapseChatInputBox() {
    const inputBox = getChatInputBox()
    inputBox?.classList.remove('is-expanded')
    syncExpandInputButton(false)
}

function syncExpandInputButton(expanded) {
    if (!expandInputBtn) return
    const isExpanded = Boolean(expanded)
    expandInputBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false')
    expandInputBtn.title = isExpanded ? 'Collapse input' : 'Expand input'
    expandInputBtn.setAttribute('aria-label', isExpanded ? 'Collapse input' : 'Expand input')
    expandInputBtn.classList.toggle('is-expanded', isExpanded)
}

function updateSendButtonState() {
    if (!sendBtn || !chatInput) return
    const hasText = Boolean(String(chatInput.value || '').trim())
    sendBtn.disabled = !hasText
    sendBtn.classList.toggle('is-empty', !hasText)
}

function toggleChatInputBox() {
    const inputBox = getChatInputBox()
    if (!inputBox || chatContainer?.classList.contains('is-welcome')) return
    if (inputBox.classList.contains('is-expanded')) {
        collapseChatInputBox()
    } else {
        expandChatInputBox()
    }
}

function getRoleLabel(role) {
    if (role === 'admin') return 'Admin'
    if (role === 'editor') return 'Editor'
    return 'User'
}

function updateUserAccountDisplay() {
    const username = currentUser?.username || localStorage.getItem('username') || ''
    const role = currentUser?.role || localStorage.getItem('role') || 'editor'
    const accountLabel = username ? `Account: ${username}` : 'Account'
    const avatarText = (username || '?').charAt(0).toUpperCase()

    if (usernameDisplay) {
        usernameDisplay.title = accountLabel
        usernameDisplay.setAttribute('aria-label', accountLabel)
    }
    if (userAccountName) userAccountName.textContent = username || 'Not signed in'
    if (userAccountRole) userAccountRole.textContent = getRoleLabel(role)
    if (userAccountAvatar) userAccountAvatar.textContent = avatarText
    if (sidebarUserAvatar) sidebarUserAvatar.textContent = avatarText
    if (sidebarUserName) sidebarUserName.textContent = username || 'Not signed in'
    if (sidebarUserRole) sidebarUserRole.textContent = getRoleLabel(role)
}

function isUserAccountDropdownOpen() {
    return userAccountDropdown && !userAccountDropdown.classList.contains('hidden')
}

function setUserAccountDropdownOpen(open) {
    if (!userAccountDropdown || !usernameDisplay) return
    userAccountDropdown.classList.toggle('hidden', !open)
    usernameDisplay.classList.toggle('is-open', open)
    usernameDisplay.setAttribute('aria-expanded', open ? 'true' : 'false')
}

function toggleUserAccountDropdown() {
    setUserAccountDropdownOpen(!isUserAccountDropdownOpen())
}

function closeUserAccountDropdown() {
    setUserAccountDropdownOpen(false)
}

function showChatPage(options = {}) {
    const enterWelcome = options?.welcome !== false
    loginPage.classList.add('hidden')
    chatPage.classList.remove('hidden')
    updateUserAccountDisplay()
    closeUserAccountDropdown()
    setSelectedMoldCategory(localStorage.getItem('mold_category') || 'injection_mold')
    chatMessages.innerHTML = ''
    chatHistory = []
    conversationId = null
    lastHITLResult = null
    updateChatSessionTitle(null)
    setWelcomeMode(enterWelcome)
    if (!enterWelcome) {
        renderWelcomeMessage()
    }
    loadConversationList({ selectLatest: false })
    loadMaterialLibrary()
}

function getSelectedMoldCategory() {
    return moldCategorySelect?.dataset?.value || 'injection_mold'
}

function getMoldCategoryLabel(category) {
    const labels = {
        injection_mold: 'Injection Mold Rules',
        stamping_mold: 'Metal Stamping Die Rules',
        casting_mold: 'Casting Mold Rules',
        forging_mold: 'Forging Die Rules',
        rubber_mold: 'Rubber Mold Rules'
    }
    return labels[category] || labels.injection_mold
}

function setSelectedMoldCategory(category) {
    const nextCategory = category || 'injection_mold'
    if (moldCategorySelect) {
        moldCategorySelect.dataset.value = nextCategory
    }
    if (moldCategoryLabel) {
        moldCategoryLabel.textContent = getMoldCategoryLabel(nextCategory)
    }
    moldCategoryDropdown?.querySelectorAll('.mold-category-dropdown-item').forEach((item) => {
        item.classList.toggle('is-active', item.dataset.value === nextCategory)
    })
    welcomeRuleChips?.querySelectorAll('.welcome-rule-chip').forEach((item) => {
        item.classList.toggle('is-active', item.dataset.value === nextCategory)
    })
}

function isMoldCategoryDropdownOpen() {
    return moldCategoryDropdown && !moldCategoryDropdown.classList.contains('hidden')
}

function setMoldCategoryDropdownOpen(open) {
    if (!moldCategoryDropdown || !moldCategorySelect) return
    moldCategoryDropdown.classList.toggle('hidden', !open)
    moldCategorySelect.classList.toggle('is-open', open)
    moldCategorySelect.setAttribute('aria-expanded', open ? 'true' : 'false')
}

function toggleMoldCategoryDropdown() {
    setMoldCategoryDropdownOpen(!isMoldCategoryDropdownOpen())
}

function closeMoldCategoryDropdown() {
    setMoldCategoryDropdownOpen(false)
}

function openNewbieGuide() {
    if (!newbieGuidePanel) return
    Logger.info('Open getting started guide')
    newbieGuidePanel.classList.remove('hidden')
    newbieGuideBtn?.setAttribute('aria-expanded', 'true')
    const focusTarget = closeNewbieGuideBtn || newbieGuideConfirmBtn
    focusTarget?.focus()
}

function closeNewbieGuide() {
    if (!newbieGuidePanel || newbieGuidePanel.classList.contains('hidden')) return
    newbieGuidePanel.classList.add('hidden')
    newbieGuideBtn?.setAttribute('aria-expanded', 'false')
    newbieGuideBtn?.focus()
}

// ============ Conversation list ============
async function loadConversationList(options = {}) {
    const selectLatest = Boolean(options?.selectLatest)
    const activeConversationId = options?.activeConversationId || conversationId
    if (!conversationList) return

    renderConversationListLoading()
    try {
        const data = await api.listConversations()
        conversations = Array.isArray(data.conversations) ? data.conversations : []
        renderConversationList(activeConversationId)
        if (selectLatest && conversations.length && !conversationId) {
            await switchConversation(conversations[0].id, { skipRefresh: true })
        }
    } catch (error) {
        Logger.error('Failed to load conversation history', { error: error.message })
        renderConversationListError(error.message)
    }
}

function refreshConversationList(activeConversationId = conversationId) {
    loadConversationList({ activeConversationId }).catch(error => {
        Logger.error('Failed to refresh conversation history', { error: error.message })
    })
}

function renderConversationListLoading() {
    if (!conversationList) return
    conversationList.innerHTML = '<div class="conversation-list-empty">Loading...</div>'
}

function renderConversationListError(message) {
    if (!conversationList) return
    conversationList.innerHTML = `<div class="conversation-list-empty">Failed to load history: ${escapeText(message || 'Please try again later')}</div>`
    if (conversationCount) {
        conversationCount.textContent = '0'
    }
    updateChatSessionTitle(conversationId)
}

function renderConversationList(activeConversationId = conversationId) {
    if (!conversationList) return
    if (conversationCount) {
        conversationCount.textContent = String(conversations.length)
    }
    updateChatSessionTitle(activeConversationId)
    const keyword = String(historySearchInput?.value || '').trim().toLowerCase()
    const filtered = keyword
        ? conversations.filter(item => {
            const title = getConversationTitle(item, Number.POSITIVE_INFINITY).toLowerCase()
            return title.includes(keyword)
        })
        : conversations
    if (!conversations.length) {
        conversationList.innerHTML = '<div class="conversation-list-empty">No conversation history</div>'
        return
    }
    if (!filtered.length) {
        conversationList.innerHTML = '<div class="conversation-list-empty">No matching conversations</div>'
        return
    }
    conversationList.innerHTML = filtered.map(item => {
        const id = item.id || ''
        const isActive = activeConversationId && id === activeConversationId
        // List shows up to 10 characters, then ellipsis; full text on hover tooltip
        const fullTitle = getConversationTitle(item, Number.POSITIVE_INFINITY)
        const displayTitle = truncateSingleLine(fullTitle, 10)
        const timeLabel = formatConversationTime(item.updated_at || item.created_at)
        return `
            <div class="conversation-item${isActive ? ' active' : ''}" data-conversation-id="${escapeAttr(id)}" role="button" tabindex="0">
                <div class="conversation-item-main">
                    <svg class="conversation-item-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
                        <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
                        <path d="M10 9H8"/>
                        <path d="M16 13H8"/>
                        <path d="M16 17H8"/>
                    </svg>
                    <span class="conversation-item-title" data-full-title="${escapeAttr(fullTitle)}">${escapeText(displayTitle)}</span>
                </div>
                <div class="conversation-item-trailing">
                    ${timeLabel ? `<span class="conversation-item-meta">${escapeText(timeLabel)}</span>` : ''}
                    <button type="button" class="conversation-delete-btn" data-conversation-id="${escapeAttr(id)}" title="Delete conversation" aria-label="Delete ${escapeAttr(fullTitle)}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            <line x1="10" x2="10" y1="11" y2="17"/>
                            <line x1="14" x2="14" y1="11" y2="17"/>
                        </svg>
                    </button>
                </div>
            </div>
        `
    }).join('')
}

function getConversationTitle(item, maxLength = 18) {
    const raw = localizeLegacyChineseText(item?.title || item?.last_message || item?.context_summary || 'New conversation')
    return compactConversationTitle(raw, maxLength)
}

function updateChatSessionTitle(activeConversationId = conversationId) {
    if (!chatSessionTitle) return
    if (!activeConversationId) {
        chatSessionTitle.textContent = 'New conversation'
        chatSessionTitle.title = 'New conversation'
        return
    }
    const item = conversations.find(entry => entry.id === activeConversationId)
    const title = getConversationTitle(item || {}, 40)
    chatSessionTitle.textContent = title
    chatSessionTitle.title = getConversationTitle(item || {}, 80)
}

function compactConversationTitle(value, maxLength = 18) {
    let text = String(value || '').replace(/\s+/g, ' ').trim()
    if (!text) return 'New conversation'
    if (/Total mold amount|Material cost total|estimation result|cost estimation/i.test(text)) {
        return 'Cost estimation result'
    }
    if (/cited sources|reference sources|according to.*(material|document|knowledge)/i.test(text)) {
        return 'Knowledge Q&A'
    }

    const dimensionTitle = buildDimensionConversationTitle(text)
    if (dimensionTitle) {
        return truncateSingleLine(dimensionTitle, maxLength)
    }

    text = stripConversationTitleFillers(text)
    text = text.split(/[.;!?]/)[0]
    text = text
        .replace(/^(design|make|estimate|calculate|quote)(\s+(a|an|one))?/i, '')
        .replace(/(what is|what are|how to|how do|why|whether|\?)$/i, '')
        .replace(/\b(of|the|a|an)\b/gi, '')
        .replace(/[,:;]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    return truncateSingleLine(text || 'New conversation', maxLength)
}

function buildDimensionConversationTitle(text) {
    const hasDimensionContext = /part|size|dimension|spec|length|width|height|quote|cost|design|cover|housing|bracket|panel|base|shell|product|mold|die/i.test(text) || /^\d/.test(text)
    if (!hasDimensionContext) return ''

    const match = text.match(/(?:part size|part dimensions|dimensions|size|spec)?\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)\s*(?:[xX×*]\s*|\s+)(\d+(?:\.\d+)?)\s*(?:[xX×*]\s*|\s+)(\d+(?:\.\d+)?)/i)
    if (!match) return ''

    const dims = `${formatCompactNumber(match[1])}×${formatCompactNumber(match[2])}×${formatCompactNumber(match[3])}`
    const partName = extractConversationPartName(text)
    return partName ? `${partName} ${dims}` : `Size ${dims}`
}

function extractConversationPartName(text) {
    const match = text.match(/([A-Za-z][A-Za-z0-9_-]{1,24}(?:\s+[A-Za-z][A-Za-z0-9_-]{1,16})?|(?:[A-Za-z0-9_-]{2,24})(?: cover| housing| bracket| panel| base| shell| part| product)?)/i)
    if (!match) return ''
    const partName = match[1]
        .replace(/\s+/g, '')
        .replace(/^(?:I want|I need|please|help me|design|make|a|an)+/i, '')
    if (!partName || /^(part size|dimensions|product size|size)$/i.test(partName)) return ''
    return partName
}

function stripConversationTitleFillers(text) {
    return text
        .replace(/^(master|hi|hello|hey|little apprentice)[,:\s]*/i, '')
        .replace(/^(please|could you|can you|help me|I want|I need|would you)[,:\s]*/i, '')
}

function formatCompactNumber(value) {
    const text = String(value || '')
    const number = Number(text)
    return Number.isFinite(number) && text.includes('.') ? String(parseFloat(text)) : text
}

function getConversationSnippet(item) {
    const raw = item?.last_message || item?.context_summary || 'No messages'
    return truncateSingleLine(raw, 48)
}

function truncateSingleLine(value, maxLength) {
    const text = String(value || '').replace(/\s+/g, ' ').trim()
    if (!text) return ''
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

function formatConversationTime(value) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const now = new Date()
    const sameYear = date.getFullYear() === now.getFullYear()
    const sameDay = sameYear && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
    if (sameDay) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('en-US', sameYear ? { month: '2-digit', day: '2-digit' } : { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function handleConversationListClick(event) {
    const deleteBtn = event.target.closest('.conversation-delete-btn')
    if (deleteBtn) {
        event.preventDefault()
        event.stopPropagation()
        deleteConversationFromList(deleteBtn.dataset.conversationId)
        return
    }

    const item = event.target.closest('.conversation-item')
    if (!item) return
    const targetConversationId = item.dataset.conversationId
    switchConversation(targetConversationId)
}

function handleConversationListKeydown(event) {
    const item = event.target.closest('.conversation-item')
    if (!item || event.target.closest('.conversation-delete-btn')) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    switchConversation(item.dataset.conversationId)
}

function handleConversationTitleTooltip(event) {
    const item = event.target.closest('.conversation-item')
    if (!item || !conversationList?.contains(item)) return
    if (event.target.closest('.conversation-delete-btn')) return
    const titleEl = item.querySelector('.conversation-item-title')
    if (!titleEl) return
    const fullTitle = titleEl.dataset.fullTitle || ''
    const displayTitle = (titleEl.textContent || '').trim()
    const isTruncated = Boolean(fullTitle) && fullTitle !== displayTitle
    if (isTruncated) {
        titleEl.setAttribute('title', fullTitle)
    } else {
        titleEl.removeAttribute('title')
    }
}

function showConfirmDialog(options = {}) {
    const {
        title = 'Confirm action',
        message = '',
        confirmText = 'OK',
        cancelText = 'Cancel',
        danger = false
    } = options

    return new Promise((resolve) => {
        const overlay = document.createElement('div')
        overlay.className = 'confirm-dialog-overlay'
        overlay.innerHTML = `
            <div class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
                <div class="confirm-dialog-header">
                    <div class="confirm-dialog-title" id="confirm-dialog-title">${escapeText(title)}</div>
                </div>
                ${message ? `<div class="confirm-dialog-body">${escapeText(message)}</div>` : ''}
                <div class="confirm-dialog-actions">
                    <button type="button" class="confirm-dialog-cancel">${escapeText(cancelText)}</button>
                    <button type="button" class="confirm-dialog-confirm${danger ? ' is-danger' : ''}">${escapeText(confirmText)}</button>
                </div>
            </div>
        `
        document.body.appendChild(overlay)

        const cleanup = (value) => {
            document.removeEventListener('keydown', handleKeydown)
            overlay.remove()
            resolve(value)
        }
        const handleKeydown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault()
                cleanup(false)
            }
        }

        overlay.querySelector('.confirm-dialog-cancel').addEventListener('click', () => cleanup(false))
        overlay.querySelector('.confirm-dialog-confirm').addEventListener('click', () => cleanup(true))
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) cleanup(false)
        })
        document.addEventListener('keydown', handleKeydown)
        overlay.querySelector('.confirm-dialog-confirm')?.focus()
    })
}

async function deleteConversationFromList(targetConversationId) {
    if (!targetConversationId) return
    const target = conversations.find(item => item.id === targetConversationId)
    const title = getConversationTitle(target || {}, 40)
    const confirmed = await showConfirmDialog({
        title: 'Delete conversation',
        message: `Delete "${title}"? This cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        danger: true
    })
    if (!confirmed) return

    const wasActive = targetConversationId === conversationId
    try {
        await api.deleteConversation(targetConversationId)
        localStorage.removeItem(getHistoryStorageKey(targetConversationId))
        conversations = conversations.filter(item => item.id !== targetConversationId)

        if (wasActive) {
            conversationId = null
            chatHistory = []
            lastHITLResult = null
            localStorage.removeItem('chat_history')
            chatMessages.innerHTML = ''
            renderWelcomeMessage()
        }

        renderConversationList(conversationId)
        refreshConversationList(conversationId)
        Logger.info('Conversation history deleted', { conversationId: targetConversationId })
    } catch (error) {
        Logger.error('Failed to delete conversation', { error: error.message })
        alert(`Failed to delete conversation: ${error.message}`)
        renderConversationList(conversationId)
    }
}

async function switchConversation(targetConversationId, options = {}) {
    if (!targetConversationId || isConversationSwitching) return
    if (targetConversationId === conversationId && chatHistory.length > 0) {
        renderConversationList(conversationId)
        return
    }

    setWelcomeMode(false)
    isConversationSwitching = true
    renderConversationList(targetConversationId)
    chatMessages.innerHTML = ''
    addMessageWithHtml('assistant', '<div class="processing-card"><div class="processing-title">Loading conversation history...</div></div>', false)

    try {
        const data = await api.getConversation(targetConversationId)
        conversationId = data.id
        renderConversationMessages(data.messages || [])
        renderConversationList(conversationId)
        if (!options?.skipRefresh) {
            refreshConversationList(conversationId)
        }
    } catch (error) {
        Logger.error('Failed to switch conversation', { error: error.message })
        chatMessages.innerHTML = ''
        renderWelcomeMessage()
        alert(`Failed to switch conversation: ${error.message}`)
        renderConversationList(conversationId)
    } finally {
        isConversationSwitching = false
    }
}

function renderConversationMessages(messages) {
    chatMessages.innerHTML = ''
    chatHistory = []
    const visibleMessages = (messages || []).filter(msg => msg && (msg.role === 'user' || msg.role === 'assistant'))
    if (!visibleMessages.length) {
        renderWelcomeMessage()
        persistHistory()
        return
    }

    visibleMessages.forEach(msg => {
        const stableId = msg.id || createMessageId()
        addMessage(msg.role, msg.content || '', false, null, stableId, msg.created_at)
        chatHistory.push({
            id: stableId,
            role: msg.role,
            content: msg.content || '',
            conversationId,
            result: null,
            createdAt: msg.created_at || new Date().toISOString()
        })
    })
    trimChatHistory()
    persistHistory()
    scrollToBottom()
}

function startNewConversation(options = {}) {
    const shouldFocus = options?.focus !== false
    conversationId = null
    chatHistory = []
    lastHITLResult = null
    clearChatHistory()
    chatMessages.innerHTML = ''
    chatInput.value = ''
    setWelcomeMode(true)
    renderConversationList(null)
    if (shouldFocus) {
        chatInput.focus()
    }
    Logger.info('New conversation; context cleared')
}

function handleMoldCategoryChange(category) {
    const nextCategory = category || getSelectedMoldCategory()
    setSelectedMoldCategory(nextCategory)
    localStorage.setItem('mold_category', nextCategory)
    closeMoldCategoryDropdown()
    Logger.info('Switch mold rule category', { category: nextCategory })
}

// ============ Event binding ============
function bindEvents() {
    // Login form submit
    loginForm.addEventListener('submit', handleLogin)
    usernameInput.addEventListener('input', handleAuthFieldInput)
    passwordInput.addEventListener('input', handleAuthFieldInput)
    passwordToggle?.addEventListener('click', togglePasswordVisibility)
    rememberUsername?.addEventListener('change', handleRememberUsernameChange)
    authLoginTab?.addEventListener('click', () => setAuthMode('login'))
    authRegisterTab?.addEventListener('click', () => setAuthMode('register'))

    // Toggle Register/Log in
    toggleAuthLink.addEventListener('click', (e) => {
        e.preventDefault()
        setAuthMode(isRegisterMode ? 'login' : 'register')
    })

    usernameDisplay?.addEventListener('click', (e) => {
        e.stopPropagation()
        toggleUserAccountDropdown()
    })
    switchAccountBtn?.addEventListener('click', handleSwitchAccount)
    logoutBtn?.addEventListener('click', () => {
        closeUserAccountDropdown()
        handleLogout()
    })
    document.addEventListener('click', (e) => {
        if (!userAccountMenu?.contains(e.target)) {
            closeUserAccountDropdown()
        }
        if (!moldCategoryMenu?.contains(e.target)) {
            closeMoldCategoryDropdown()
        }
        if (!e.target.closest('.material-select-menu')) {
            closeAllMaterialDropdowns()
        }
    })
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeUserAccountDropdown()
            closeMoldCategoryDropdown()
            closeAllMaterialDropdowns()
        }
    })

    newConversationBtn?.addEventListener('click', () => startNewConversation())
    historySearchInput?.addEventListener('input', () => {
        renderConversationList(conversationId)
    })
    newbieGuideBtn?.addEventListener('click', () => openNewbieGuide())
    closeNewbieGuideBtn?.addEventListener('click', () => closeNewbieGuide())
    newbieGuideConfirmBtn?.addEventListener('click', () => closeNewbieGuide())
    newbieGuidePanel?.addEventListener('click', (e) => {
        if (e.target.closest('[data-close-newbie-guide]')) {
            closeNewbieGuide()
        }
    })
    conversationList?.addEventListener('click', handleConversationListClick)
    conversationList?.addEventListener('keydown', handleConversationListKeydown)
    conversationList?.addEventListener('mouseover', handleConversationTitleTooltip)
    conversationList?.addEventListener('focusin', handleConversationTitleTooltip)

    // Send message
    sendBtn.addEventListener('click', handleSendMessage)
    chatInput.addEventListener('input', updateSendButtonState)
    updateSendButtonState()
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            const inputBox = chatInput.closest('.chat-input-box')
            const inConversation = chatContainer && !chatContainer.classList.contains('is-welcome')
            if (inConversation && inputBox && !inputBox.classList.contains('is-expanded')) {
                expandChatInputBox()
                return
            }
            handleSendMessage()
        }
    })
    chatInput.addEventListener('blur', () => {
        // Defer so send-button click can run first
        setTimeout(() => {
            if (document.activeElement === chatInput) return
            if (document.activeElement === expandInputBtn) return
            if (String(chatInput.value || '').trim()) return
            collapseChatInputBox()
        }, 120)
    })

    expandInputBtn?.addEventListener('mousedown', (e) => {
        // Keep input focus so blur→collapse does not undo expand
        e.preventDefault()
    })
    expandInputBtn?.addEventListener('click', (e) => {
        e.preventDefault()
        toggleChatInputBox()
    })

    attachFileBtn?.addEventListener('mousedown', (e) => {
        e.preventDefault()
    })
    attachFileBtn?.addEventListener('click', (e) => {
        e.preventDefault()
        openFilePanel()
    })

    // Voice input
    voiceBtn.addEventListener('click', handleVoiceInput)

    // File panel
    fileBtn.addEventListener('click', openFilePanel)
    moldCategorySelect?.addEventListener('click', (e) => {
        e.stopPropagation()
        toggleMoldCategoryDropdown()
    })
    moldCategoryDropdown?.addEventListener('click', (e) => {
        const item = e.target.closest('.mold-category-dropdown-item')
        if (!item) return
        e.stopPropagation()
        handleMoldCategoryChange(item.dataset.value)
    })
    welcomeRuleChips?.addEventListener('click', (e) => {
        const chip = e.target.closest('.welcome-rule-chip')
        if (!chip) return
        handleMoldCategoryChange(chip.dataset.value)
    })
    closeFilePanel.addEventListener('click', closeFilePanelHandler)
    filePanel?.addEventListener('click', (e) => {
        if (e.target.closest('[data-close-file-panel]')) {
            closeFilePanelHandler()
        }
    })
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && filePanel && !filePanel.classList.contains('hidden')) {
            closeFilePanelHandler()
        }
        if (e.key === 'Escape' && newbieGuidePanel && !newbieGuidePanel.classList.contains('hidden')) {
            closeNewbieGuide()
        }
    })
    selectFileBtn.addEventListener('click', () => fileInput.click())
    fileInput.addEventListener('change', handleFileSelect)

    // Drag-and-drop upload
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault()
        fileUploadArea.classList.add('drag-active')
    })
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('drag-active')
    })
    fileUploadArea.addEventListener('drop', handleFileDrop)

    // Result feedback
    chatMessages.addEventListener('click', handleFormulaToggleClick)
    chatMessages.addEventListener('click', handleFormulaParamClick)
    chatMessages.addEventListener('click', handleHITLActionClick)
    chatMessages.addEventListener('click', handleKnowledgePatchClick)
    chatMessages.addEventListener('click', handleMaterialSelectClick)
}

// ============ Auth handling ============
async function handleLogin(e) {
    e.preventDefault()
    clearAuthValidation()
    loginBtn.disabled = true
    loginBtn.textContent = isRegisterMode ? 'Registering...' : 'Logging in...'

    const username = usernameInput.value
    const password = passwordInput.value

    const validationError = validateAuthInput(username, password)
    if (validationError) {
        loginError.textContent = validationError.message
        markInvalidAuthField(validationError.field)
        Logger.warn(`${isRegisterMode ? 'Register' : 'Log in'} failed: ${validationError.message}`)
        resetLoginBtn()
        return
    }

    try {
        Logger.info(`Start ${isRegisterMode ? 'Register' : 'Log in'}`, { username })

        let data
        if (isRegisterMode) {
            // After successful registration, auto log in
            await api.register(username, password)
            data = await api.login(username, password)
        } else {
            data = await api.login(username, password)
        }

        // Save user info
        localStorage.setItem('token', data.token)
        localStorage.setItem('user_id', data.user_id)
        localStorage.setItem('username', data.username)
        localStorage.setItem('role', data.role || 'editor')
        syncRememberedUsername(username)

        currentUser = data
        Logger.info(`${isRegisterMode ? 'Register' : 'Log in'} succeeded`, { username })
        showChatPage()
    } catch (error) {
        Logger.error(`Log inFailed: ${error.message}`)
        loginError.textContent = error.message
        markServerAuthError(error.message)
    } finally {
        resetLoginBtn()
    }
}

function handleAuthFieldInput() {
    clearAuthValidation()
    updateAuthFieldFeedback()
}

function setAuthMode(mode) {
    isRegisterMode = mode === 'register'
    updateAuthMode()
}

function getPasswordStrength(password) {
    if (!password) {
        return { score: 0, label: 'waiting for input' }
    }
    let score = 0
    if (password.length >= 6) score += 1
    if (PASSWORD_HAS_LETTER.test(password) && PASSWORD_HAS_DIGIT.test(password)) score += 1
    if (password.length >= 10) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    const labels = ['Weak', 'Basic', 'Fair', 'Good', 'Strong']
    return { score, label: labels[score] || labels[0] }
}

function updatePasswordStrength() {
    if (!passwordStrength || !passwordStrengthText) return
    passwordStrength.classList.toggle('hidden', !isRegisterMode)
    const { score, label } = getPasswordStrength(passwordInput.value)
    passwordStrength.className = `password-strength score-${score}${isRegisterMode ? '' : ' hidden'}`
    passwordStrengthText.textContent = `Password strength: ${label}`
}

function setFieldHint(element, message, state = '') {
    if (!element) return
    element.textContent = message
    element.classList.toggle('is-error', state === 'error')
    element.classList.toggle('is-ok', state === 'ok')
}

function updateAuthFieldFeedback() {
    const username = usernameInput.value.trim()
    const password = passwordInput.value
    const usernameOk = USERNAME_PATTERN.test(username)
    const passwordOk = password.length >= 6 && password.length <= 20 && PASSWORD_HAS_LETTER.test(password) && PASSWORD_HAS_DIGIT.test(password)

    usernameInput.classList.toggle('valid', isRegisterMode && usernameOk)
    passwordInput.classList.toggle('valid', isRegisterMode && passwordOk)
    usernameInput.classList.toggle('invalid', isRegisterMode && Boolean(username) && !usernameOk)
    passwordInput.classList.toggle('invalid', isRegisterMode && Boolean(password) && !passwordOk)

    if (!isRegisterMode) {
        setFieldHint(usernameHint, 'Enter any username to continue')
        setFieldHint(passwordHint, 'Enter any password to continue')
        updatePasswordStrength()
        return
    }

    if (!username) {
        setFieldHint(usernameHint, 'Username is validated as you type')
    } else if (usernameOk) {
        setFieldHint(usernameHint, 'Username format is valid', 'ok')
    } else {
        setFieldHint(usernameHint, USERNAME_RULE_MESSAGE, 'error')
    }

    if (!password) {
        setFieldHint(passwordHint, 'Password is validated as you type')
    } else if (passwordOk) {
        setFieldHint(passwordHint, 'Password format is valid', 'ok')
    } else {
        setFieldHint(passwordHint, PASSWORD_RULE_MESSAGE, 'error')
    }
    updatePasswordStrength()
}

function validateAuthInput(username, password) {
    if (!username && !password) {
        return { field: 'both', message: 'Please enter username and password' }
    }
    if (!username) {
        return { field: 'username', message: 'Please enter username' }
    }
    if (!password) {
        return { field: 'password', message: 'Please enter password' }
    }
    if (isRegisterMode && !USERNAME_PATTERN.test(username)) {
        return { field: 'username', message: USERNAME_RULE_MESSAGE }
    }
    if (isRegisterMode && (password.length < 6 || password.length > 20 || !PASSWORD_HAS_LETTER.test(password) || !PASSWORD_HAS_DIGIT.test(password))) {
        return { field: 'password', message: PASSWORD_RULE_MESSAGE }
    }
    return null
}

function markInvalidAuthField(field) {
    usernameInput.classList.toggle('invalid', field === 'username' || field === 'both')
    passwordInput.classList.toggle('invalid', field === 'password' || field === 'both')
}

function markServerAuthError(message) {
    if (/usernameorpassword/.test(message)) {
        markInvalidAuthField('both')
    } else if (/username/.test(message)) {
        markInvalidAuthField('username')
    } else if (/password/.test(message)) {
        markInvalidAuthField('password')
    } else {
        markInvalidAuthField('both')
    }
}

function clearAuthValidation() {
    loginError.textContent = ''
    usernameInput.classList.remove('invalid')
    passwordInput.classList.remove('invalid')
}

function togglePasswordVisibility() {
    const shouldShow = passwordInput.type === 'password'
    passwordInput.type = shouldShow ? 'text' : 'password'
    passwordToggle.textContent = shouldShow ? 'Hide' : 'Show'
    passwordToggle.setAttribute('aria-label', shouldShow ? 'Hide password' : 'Show password')
    passwordToggle.setAttribute('aria-pressed', String(shouldShow))
    passwordInput.focus()
}

function restoreRememberedUsername() {
    if (!rememberUsername) return
    const remembered = localStorage.getItem('remembered_username') || ''
    rememberUsername.checked = Boolean(remembered)
    if (!usernameInput.value && remembered) {
        usernameInput.value = remembered
    }
}

function syncRememberedUsername(username) {
    if (!rememberUsername) return
    if (rememberUsername.checked) {
        localStorage.setItem('remembered_username', username)
    } else {
        localStorage.removeItem('remembered_username')
    }
}

function handleRememberUsernameChange() {
    if (!rememberUsername.checked) {
        localStorage.removeItem('remembered_username')
        return
    }
    const username = usernameInput.value.trim()
    if (username) {
        localStorage.setItem('remembered_username', username)
    }
}

function resetLoginBtn() {
    loginBtn.disabled = false
    loginBtn.textContent = isRegisterMode ? 'Register and continue' : 'Log in'
}

function updateAuthMode() {
    loginForm.dataset.mode = isRegisterMode ? 'register' : 'login'
    authLoginTab?.classList.toggle('active', !isRegisterMode)
    authRegisterTab?.classList.toggle('active', isRegisterMode)
    authLoginTab?.setAttribute('aria-selected', String(!isRegisterMode))
    authRegisterTab?.setAttribute('aria-selected', String(isRegisterMode))

    if (isRegisterMode) {
        loginBtn.textContent = 'Register and continue'
        toggleAuthText.innerHTML = 'Already have an account? <a href="#" id="toggle-auth-link">Log in</a>'
        passwordInput.setAttribute('autocomplete', 'new-password')
    } else {
        loginBtn.textContent = 'Log in'
        toggleAuthText.innerHTML = 'No account? <a href="#" id="toggle-auth-link">Register</a>'
        passwordInput.setAttribute('autocomplete', 'current-password')
    }
    // Re-bind click handlers
    document.getElementById('toggle-auth-link').addEventListener('click', (e) => {
        e.preventDefault()
        setAuthMode(isRegisterMode ? 'login' : 'register')
    })
    clearAuthValidation()
    updateAuthFieldFeedback()
}

function handleSwitchAccount() {
    Logger.info('User switched account')
    closeUserAccountDropdown()
    localStorage.removeItem('token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    conversations = []
    renderConversationList(null)
    currentUser = null
    conversationId = null
    chatHistory = []
    chatMessages.innerHTML = ''
    passwordInput.value = ''
    isRegisterMode = false
    updateAuthMode()
    restoreRememberedUsername()
    showLoginPage()
}

function handleLogout() {
    Logger.info('User logged out')
    closeUserAccountDropdown()
    localStorage.removeItem('token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    clearChatHistory({ allForUser: true })  // Clear chat history
    conversations = []
    renderConversationList(null)
    currentUser = null
    conversationId = null
    usernameInput.value = ''
    passwordInput.value = ''
    isRegisterMode = false
    updateAuthMode()
    showLoginPage()
}

// ============ Chat handling ============
async function handleSendMessage() {
    const message = chatInput.value.trim()
    if (!message) return

    if (isWelcomeMode) {
        setWelcomeMode(false)
        chatMessages.innerHTML = ''
        chatHistory = []
        conversationId = null
    }

    await sendChatMessage(message)
}

async function sendChatMessage(message, { shouldEchoUser = true } = {}) {
    const normalizedMessage = String(message || '').trim()
    if (!normalizedMessage) return

    const previousConversationId = conversationId
    Logger.info('Send message', { message: message.substring(0, 100), conversationId })

    if (shouldEchoUser) {
        addMessage('user', normalizedMessage)
    }
    if (chatInput.value.trim() === normalizedMessage) {
        chatInput.value = ''
        updateSendButtonState()
    }
    collapseChatInputBox()

    // Show processing state
    const loadingMsg = addMessageWithHtml(
        'assistant',
        buildProcessingMessageHtml(normalizedMessage, currentChatMode),
        true,
        null,
        null,
        'Processing...'
    )

    try {
        const data = await api.sendMessage(normalizedMessage, conversationId, getSelectedMoldCategory(), currentChatMode)

        // Update conversation_id
        if (data.conversation_id) {
            conversationId = data.conversation_id
            // Update conversationId in history
            updateHistoryConversationId(conversationId)
            renderConversationList(conversationId)
            if (!previousConversationId || previousConversationId !== conversationId) {
                refreshConversationList(conversationId)
            }
            const hitl = data.result?.hitl_confirmation
            const isHITL = Boolean(hitl)
            if (isHITL) {
                /*
                Logger.info('Received HITL reply', { conversationId })
                */
                Logger.info('Received HITL response', { conversationId })
                const hitlQuestionText = data.second_message || hitl?.confirm_question || hitl?.message || data.message
                lastHITLResult = data.result
                replaceMessage(loadingMsg, 'assistant', data.message, data.result)
                setTimeout(() => {
                    addMessageWithHtml(
                        'assistant',
                        buildHitlSecondMessageHtml(hitl, hitlQuestionText, data.result),
                        false
                    )
                }, 100)
                return
            }
            lastHITLResult = null
        }

        Logger.info('Received reply', { conversationId })
        // Replace loading message with actual reply
        replaceMessage(loadingMsg, 'assistant', data.message, data.result)
        refreshConversationList(conversationId)
    } catch (error) {
        Logger.error(`Send messageFailed: ${error.message}`)
        replaceMessage(loadingMsg, 'assistant', `Sorry, an error occurred: ${error.message}`)
    }
}

function buildProcessingMessageHtml(message, mode = currentChatMode) {
    const text = String(message || '')
    const selectedMode = mode === 'quote' ? 'quote' : 'rag_qa'
    const isRuleUpdate = /(modify|change|update|set|set to|add|add row|delete|rename|formula|rule|unit price|adjust)/i.test(text)
    const knowledgeSteps = ['Understanding the question...', 'Searching the knowledge base...', 'Organizing supporting evidence...', 'Generating the answer...']
    const quoteSteps = ['Detecting quote intent...', 'Indexing current scenario rules...', 'Calculating the quote table...', 'Organizing the breakdown...']
    const ruleSteps = ['Detecting rule changes...', 'Computing preview snapshot...', 'Generating attribution analysis...', 'Preparing confirmation...']
    const steps = selectedMode === 'rag_qa' ? knowledgeSteps : isRuleUpdate ? ruleSteps : quoteSteps
    const title = selectedMode === 'rag_qa' ? 'Thinking' : isRuleUpdate ? 'Processing rules' : 'Calculating quote'
    return `
        <div class="processing-card" role="status" aria-live="polite">
            <div class="processing-title">${title}</div>
            <div class="processing-steps">
                ${steps.map((step, index) => `
                    <div class="processing-step" style="--step-index: ${index}">
                        <span class="processing-dot"></span>
                        <span>${escapeText(step)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `
}

function getAssistantLoadingAvatarHtml(role, htmlContent = '') {
    if (role !== 'assistant') return ''
    if (!String(htmlContent).includes('processing-card')) return ''
    return `
        <div class="message-avatar" aria-hidden="true">
            <svg class="message-avatar-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" width="32" height="32">
                <g clip-path="url(#msg-robot-clip)">
                    <circle cx="16" cy="16" r="16" fill="url(#msg-robot-bg)"/>
                    <g filter="url(#msg-robot-face-shadow)">
                        <ellipse cx="16" cy="16" rx="13" ry="9" fill="url(#msg-robot-face)"/>
                        <path d="M16 7.5C19.501 7.5 22.6493 8.483 24.9082 10.0469C27.169 11.6121 28.5 13.7252 28.5 16C28.5 18.2748 27.169 20.3879 24.9082 21.9531C22.6493 23.517 19.501 24.5 16 24.5C12.499 24.5 9.35072 23.517 7.0918 21.9531C4.83101 20.3879 3.5 18.2748 3.5 16C3.5 13.7252 4.83101 11.6121 7.0918 10.0469C9.35072 8.483 12.499 7.5 16 7.5Z" stroke="url(#msg-robot-face-ring)"/>
                    </g>
                    <g class="message-avatar-eye" filter="url(#msg-robot-eye-l)">
                        <rect x="10" y="13" width="4" height="6" rx="2" fill="#6EE5FF"/>
                        <rect x="10.1" y="13.1" width="3.8" height="5.8" rx="1.9" stroke="url(#msg-robot-eye-shine-l)" stroke-width="0.2"/>
                    </g>
                    <g class="message-avatar-eye" filter="url(#msg-robot-eye-r)">
                        <rect x="18" y="13" width="4" height="6" rx="2" fill="#6EE5FF"/>
                        <rect x="18.1" y="13.1" width="3.8" height="5.8" rx="1.9" stroke="url(#msg-robot-eye-shine-r)" stroke-width="0.2"/>
                    </g>
                </g>
                <defs>
                    <filter id="msg-robot-face-shadow" x="3" y="7" width="30" height="24" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                        <feOffset dx="2" dy="4"/>
                        <feGaussianBlur stdDeviation="1"/>
                        <feComposite in2="hardAlpha" operator="out"/>
                        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.3 0"/>
                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
                    </filter>
                    <filter id="msg-robot-eye-l" x="8" y="11" width="8" height="10" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                        <feOffset/>
                        <feGaussianBlur stdDeviation="1"/>
                        <feComposite in2="hardAlpha" operator="out"/>
                        <feColorMatrix type="matrix" values="0 0 0 0 0.113725 0 0 0 0 0.305882 0 0 0 0 0.847059 0 0 0 1 0"/>
                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
                    </filter>
                    <filter id="msg-robot-eye-r" x="16" y="11" width="8" height="10" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                        <feOffset/>
                        <feGaussianBlur stdDeviation="1"/>
                        <feComposite in2="hardAlpha" operator="out"/>
                        <feColorMatrix type="matrix" values="0 0 0 0 0.113725 0 0 0 0 0.305882 0 0 0 0 0.847059 0 0 0 1 0"/>
                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
                    </filter>
                    <radialGradient id="msg-robot-bg" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(9.5 9) rotate(52.8831) scale(23.2002)">
                        <stop stop-color="white"/>
                        <stop offset="1" stop-color="#C3CBFF"/>
                    </radialGradient>
                    <linearGradient id="msg-robot-face" x1="16" y1="7" x2="16" y2="25" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#484FAB"/>
                        <stop offset="1" stop-color="#37375E"/>
                    </linearGradient>
                    <linearGradient id="msg-robot-face-ring" x1="16" y1="7" x2="16" y2="25" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#7BEEE5"/>
                        <stop offset="0.403846" stop-color="#7C71FB"/>
                        <stop offset="1" stop-color="#B083EC"/>
                    </linearGradient>
                    <linearGradient id="msg-robot-eye-shine-l" x1="12" y1="13" x2="12" y2="19" gradientUnits="userSpaceOnUse">
                        <stop stop-color="white"/>
                        <stop offset="0.884615" stop-color="white" stop-opacity="0"/>
                    </linearGradient>
                    <linearGradient id="msg-robot-eye-shine-r" x1="20" y1="13" x2="20" y2="19" gradientUnits="userSpaceOnUse">
                        <stop stop-color="white"/>
                        <stop offset="0.884615" stop-color="white" stop-opacity="0"/>
                    </linearGradient>
                    <clipPath id="msg-robot-clip">
                        <rect width="32" height="32" fill="white"/>
                    </clipPath>
                </defs>
            </svg>
        </div>
    `
}

function addMessage(role, content, shouldSave = true, result = null, messageId = null, createdAt = null) {
    const msgDiv = document.createElement('div')
    msgDiv.className = `message message-${role}`
    const stableMessageId = messageId || createMessageId()
    msgDiv.dataset.messageId = stableMessageId

    msgDiv.innerHTML = `
        <div class="message-content">${renderMessageContent(role, content, result)}</div>
    `

    chatMessages.appendChild(msgDiv)
    scrollToBottom()

    // Save to local history
    if (shouldSave) {
        saveChatHistory(role, content, result, stableMessageId, createdAt)
    }

    return msgDiv
}

function addMessageWithHtml(role, htmlContent, shouldSave = false, result = null, messageId = null, content = '', createdAt = null) {
    const msgDiv = document.createElement('div')
    msgDiv.className = `message message-${role}`
    const stableMessageId = messageId || createMessageId()
    msgDiv.dataset.messageId = stableMessageId

    msgDiv.innerHTML = `
        ${getAssistantLoadingAvatarHtml(role, htmlContent)}
        <div class="message-content">${htmlContent}</div>
    `

    chatMessages.appendChild(msgDiv)
    scrollToBottom()

    if (shouldSave) {
        saveChatHistory(role, content, result, stableMessageId, createdAt)
    }

    return msgDiv
}

function replaceMessage(msgDiv, role, content, result = null, createdAt = null) {
    const stableMessageId = msgDiv.dataset.messageId || createMessageId()
    msgDiv.dataset.messageId = stableMessageId

    msgDiv.className = `message message-${role}`
    msgDiv.innerHTML = `
        <div class="message-content">${renderMessageContent(role, content, result)}</div>
    `

    const existingIndex = chatHistory.findIndex(msg => msg.id === stableMessageId)
    if (existingIndex >= 0) {
        chatHistory[existingIndex] = {
            ...chatHistory[existingIndex],
            role,
            content,
            result,
            conversationId,
            createdAt: createdAt || chatHistory[existingIndex].createdAt || new Date().toISOString()
        }
    } else {
        chatHistory.push({
            id: stableMessageId,
            role,
            content,
            conversationId,
            result,
            createdAt: createdAt || new Date().toISOString()
        })
        trimChatHistory()
    }
    persistHistory()

    scrollToBottom()
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight
}

function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML.replace(/\n/g, '<br>')
}

/** Assistant plain text: soft line breaks after sentence endings for readability */
function formatAssistantPlainText(text) {
    const withBreaks = String(text ?? '').replace(/([.!?])(?=[^\s\n])/g, '$1\n')
    return escapeHtml(withBreaks)
}

function escapeText(text) {
    const div = document.createElement('div')
    div.textContent = text ?? ''
    return div.innerHTML
}

function escapeAttr(text) {
    return escapeText(text).replace(/"/g, '&quot;')
}

function isReadableChineseText(value) {
    const text = String(value || '').trim()
    return /[\u4e00-\u9fff]/.test(text) && !/[?]{2,}|[A-Za-z_]{3,}/.test(text)
}

function getFormulaDisplayName(key, fallback = '') {
    const normalizedKey = String(key || '').trim()
    if (isReadableChineseText(normalizedKey)) {
        return normalizedKey
    }
    if (isReadableChineseText(fallback)) {
        return String(fallback).trim()
    }
    if (normalizedKey && FORMULA_DISPLAY_NAME_MAP[normalizedKey]) {
        return FORMULA_DISPLAY_NAME_MAP[normalizedKey]
    }
    if (fallback && FORMULA_DISPLAY_NAME_MAP[String(fallback).trim()]) {
        return FORMULA_DISPLAY_NAME_MAP[String(fallback).trim()]
    }
    return String(fallback || normalizedKey || '-').trim()
}

function getMoldTypeDisplayName(value) {
    const key = String(value || '').trim()
    if (!key) {
        return '-'
    }
    return MOLD_TYPE_DISPLAY_NAME_MAP[key] || (/^[A-Za-z0-9_:-]+$/.test(key) ? 'Unknown mold type' : key)
}

function translateFormulaExpression(expression) {
    if (expression === undefined || expression === null) {
        return '-'
    }
    return String(expression)
        .replace(/\*/g, '×')
        .replace(/\//g, '÷')
        .replace(/\b[A-Za-z_][A-Za-z0-9_]*\b/g, token => {
            const lower = token.toLowerCase()
            return FORMULA_FUNCTION_NAME_MAP[lower] || FORMULA_DISPLAY_NAME_MAP[token] || token
        })
}

function translateFormulaText(text) {
    if (text === undefined || text === null) {
        return '-'
    }
    let translated = translateFormulaExpression(text)
    Object.entries(MOLD_TYPE_DISPLAY_NAME_MAP).forEach(([key, label]) => {
        translated = translated.replace(new RegExp(`\\b${key}\\b`, 'g'), label)
    })
    Object.entries(FORMULA_SOURCE_NAME_MAP).forEach(([key, label]) => {
        translated = translated.replace(new RegExp(`\\b${key}\\b`, 'g'), label)
    })
    return translated
}

function preserveUnitSlashes(text) {
    return String(text || '').replace(
        /(CNY|yuan|kg|g|mm|cm2|cm²)\/(pc|point|kg|g|mm|cm2|cm²|set)/gi,
        '$1__UNIT_SLASH__$2'
    )
}

function translateHitlText(text) {
    if (text === undefined || text === null) {
        return '-'
    }
    return translateFormulaText(preserveUnitSlashes(text)).replace(/__UNIT_SLASH__/g, '/')
}

function buildMaterialDetailAliasMap(detail = {}) {
    const materialRows = Array.isArray(detail?.material_detail) ? detail.material_detail : []
    const dimLabelMap = { length: 'Length', width: 'Width', height: 'Height' }
    const aliasMap = {}
    materialRows.forEach(part => {
        const displayName = String(part?.name || '').trim()
        const tracePartName = String(part?.source_name || part?.original_name || part?.system_name || part?.name || '').trim()
        const rowKey = String(part?.row_key || '').trim()
        if (tracePartName && displayName && tracePartName !== displayName) {
            aliasMap[tracePartName] = displayName
        }
        Object.entries(dimLabelMap).forEach(([dimension, dimLabel]) => {
            if (rowKey && displayName) {
                aliasMap[`${rowKey}_${dimension}`] = `${displayName}${dimLabel}`
            }
            if (tracePartName && displayName) {
                aliasMap[`${tracePartName}${dimLabel}`] = `${displayName}${dimLabel}`
            }
        })
    })
    return aliasMap
}

function localizeMaterialDetailText(text, detail = {}) {
    if (text === undefined || text === null) {
        return ''
    }
    let localized = String(text)
    const aliasMap = buildMaterialDetailAliasMap(detail)
    Object.entries(aliasMap)
        .sort((a, b) => String(b[0]).length - String(a[0]).length)
        .forEach(([source, target]) => {
            if (!source || !target || source === target) {
                return
            }
            localized = localized.replaceAll(String(source), String(target))
        })
    return localized
}

function formatFormulaRuntimeExpression(field, trace, sourceMeta = {}, detail = {}) {
    const sourceType = String(
        sourceMeta?.rule_source_type
        || sourceMeta?.source
        || sourceMeta?.asset_source
        || sourceMeta?.source_type
        || ''
    ).trim()
    const rawExpression = String(trace?.expression || trace?.formula || '').trim()
    const isCalculationParam = CALCULATION_PARAMETER_FIELDS.has(String(field || '').trim())
    const isFixedStandardPartsFormulaRuntimeParam = String(field || '').trim() === 'standard_parts_cost'
        && String(detail.standard_parts_cost_mode || '').trim().toLowerCase() === 'fixed'

    if (sourceType === 'runtime') {
        return 'Runtime parameters'
    }
    if (isFixedStandardPartsFormulaRuntimeParam) {
        return 'Runtime parameters'
    }
    if (!rawExpression) {
        return isCalculationParam ? 'Runtime parameters' : '-'
    }

    const localizedFormula = localizeMaterialDetailText(rawExpression, detail)
    const translated = translateFormulaExpression(localizedFormula)
    if (!isCalculationParam) {
        return translated || '-'
    }

    if (/^-?\d+(?:\.\d+)?$/.test(rawExpression)) {
        return `User-defined absolute value: ${rawExpression}`
    }

    if (sourceType === 'system_default') {
        return `System default formula: ${translated}`
    }
    if (sourceType === 'template_override') {
        return `Template override value: ${translated}`
    }
    if (sourceType === 'manual' || sourceType === 'formula_asset' || sourceType === 'formula_memory') {
        return `User-defined formula: ${translated}`
    }
    return translated || 'Runtime parameters'
}

function renderMessageContent(role, content, result = null) {
    const localizedContent = localizeLegacyChineseText(content)
    if (role === 'assistant' && hasRenderableCalculation(result)) {
        return renderCalculationResult(result, localizedContent)
    }
    const base = role === 'assistant' ? formatAssistantPlainText(localizedContent) : escapeHtml(localizedContent)
    if (role === 'assistant' && result?.kb_sources?.length) {
        return base + renderAppliedAnswerCorrections(result.applied_answer_corrections) + renderKBSources(result.kb_sources, result, localizedContent)
    }
    return base + renderAppliedAnswerCorrections(result?.applied_answer_corrections)
}

function renderAppliedAnswerCorrections(corrections) {
    const items = (corrections || []).filter(item => item && item.correct_answer).slice(0, 3)
    if (!items.length) return ''
    let html = '<div class="kb-applied-corrections"><div class="kb-answer-sources-title">Applied answer corrections</div>'
    items.forEach(item => {
        html += `
        <div class="kb-applied-correction">
            <div>${escapeText(item.correct_answer)}</div>
            <div class="kb-answer-source-meta">
                <span>${escapeText(item.field || 'correction')}</span>
                <span>${escapeText(item.correction_id || '')}</span>
                <span>${escapeText(item.scope_doc || '')}</span>
            </div>
        </div>`
    })
    html += '</div>'
    return html
}

function renderKBSources(sources, result = {}, answerText = '') {
    const canEdit = canEditKBContent()
    const items = (sources || []).filter(src => src && (src.text || src.summary_cn)).slice(0, 5)
    if (!items.length) return ''
    let html = `
    <div class="kb-answer-sources" data-question="${escapeAttr(result?.query || '')}" data-wrong-answer="${escapeAttr(answerText || '')}">
        <div class="kb-answer-sources-header">
            <div class="kb-answer-sources-title-group">
                <div class="kb-answer-sources-title">Cited sources</div>
                <span class="kb-answer-sources-subtitle">PDF evidence · ${items.length}</span>
            </div>
            ${canEdit ? '<button type="button" class="kb-answer-correct-btn" title="Correct this answer only; do not change the PDF knowledge chunk">Correct answer</button>' : ''}
        </div>`
    items.forEach((src, index) => {
        const text = localizeLegacyChineseText(src.text || src.summary_cn || '')
        const page = src.page_start && src.page_end && String(src.page_start) !== String(src.page_end)
            ? `${src.page_start}-${src.page_end}`
            : (src.page_id || src.page_start || '?')
        const sourceType = src.retrieval_source === 'structured_table' ? 'Table hit' : src.retrieval_source === 'merged_chunk' ? 'Merged chunk' : 'Raw chunk'
        html += `
        <div class="kb-answer-source"
             data-doc-id="${escapeAttr(src.doc_id || '')}"
             data-source-doc="${escapeAttr(src.source_doc || '')}"
             data-summary-id="${escapeAttr(src.summary_id || '')}"
             data-chunk-id="${escapeAttr(src.chunk_id || '')}"
             data-page-id="${escapeAttr(page || '')}">
            <div class="kb-answer-source-meta">
                <span class="kb-source-tag kb-source-tag-file" title="${escapeAttr(localizeLegacyChineseText(src.source_doc || src.doc_id || 'PDF'))}">${escapeText(compactId(localizeLegacyChineseText(src.source_doc || src.doc_id || 'PDF'), 24, 8))}</span>
                <span class="kb-source-tag kb-source-tag-page">p.${escapeText(page)}</span>
                <span class="kb-source-tag kb-source-tag-type">${escapeText(sourceType)}</span>
                ${src.section ? `<span class="kb-source-tag kb-source-tag-section" title="${escapeAttr(src.section)}">${escapeText(compactId(src.section, 18, 8))}</span>` : ''}
            </div>
            <div class="kb-answer-source-text">${escapeText(text)}</div>
            <div class="kb-source-actions">
                ${canEdit && src.doc_id && src.chunk_id ? `<button type="button" class="kb-edit-source-btn" data-source-index="${index}" title="Patch this cited chunk; later retrieval prefers the corrected content">Patch source chunk</button>` : ''}
            </div>
        </div>`
    })
    html += '</div>'
    return html
}

async function handleKnowledgePatchClick(event) {
    const answerBtn = event.target.closest('.kb-answer-correct-btn')
    if (answerBtn) {
        await handleAnswerCorrectionClick(answerBtn)
        return
    }
    const btn = event.target.closest('.kb-edit-source-btn')
    if (!btn) return
    if (!canEditKBContent()) {
        alert('This account cannot modify knowledge base content.')
        return
    }
    const card = btn.closest('.kb-answer-source')
    if (!card) return
    const docId = card.dataset.docId || ''
    const chunkId = card.dataset.chunkId || ''
    const textEl = card.querySelector('.kb-answer-source-text')
    const beforeText = textEl ? textEl.textContent.trim() : ''
    if (!docId || !chunkId || !beforeText) {
        alert('Missing doc_id, chunk_id, or original text; cannot patch.')
        return
    }

    const patchInput = await openKBCorrectionDialog({
        mode: 'knowledge',
        title: 'Patch source chunk',
        eyebrow: 'Knowledge chunk override',
        description: 'Use when OCR, table recognition, or PDF parsing content is wrong.',
        confirmText: 'Save patch',
        meta: [
            card.dataset.sourceDoc || docId,
            `p.${card.dataset.pageId || '?'}`,
            compactId(chunkId)
        ].filter(Boolean).join(' · '),
        fields: [
            { name: 'before_text', label: 'Current chunk', type: 'textarea', value: beforeText, readonly: true, rows: 6 },
            { name: 'after_text', label: 'Patched chunk', type: 'textarea', value: beforeText, required: true, rows: 8 },
            { name: 'reason', label: 'Patch reason', type: 'input', value: 'direct_knowledge_correction', required: true }
        ]
    })
    if (!patchInput) return
    const normalizedAfter = String(patchInput.after_text || '').trim()
    if (!normalizedAfter) {
        alert('Patched content cannot be empty.')
        return
    }
    if (normalizedAfter === beforeText) {
        alert('Content unchanged; nothing to submit.')
        return
    }

    try {
        btn.disabled = true
        btn.textContent = 'Saving'
        await api.patchKBChunk({
            docId,
            chunkId,
            beforeText,
            afterText: normalizedAfter,
            reason: String(patchInput.reason || '').trim() || 'direct_knowledge_correction'
        })
        textEl.textContent = normalizedAfter
        btn.textContent = 'Patched'
        card.classList.add('kb-source-patched')
        alert('Saved and active. Later retrieval of the same knowledge prefers the patched content.')
    } catch (err) {
        btn.textContent = 'Patch source chunk'
        alert('Failed to patch knowledge: ' + err.message)
    } finally {
        btn.disabled = false
    }
}

async function handleAnswerCorrectionClick(btn) {
    if (!canEditKBContent()) {
        alert('This account cannot correct knowledge base answers.')
        return
    }
    const wrapper = btn.closest('.kb-answer-sources')
    if (!wrapper) return
    const correctionInput = await openKBCorrectionDialog({
        mode: 'answer',
        title: 'Correct answer',
        eyebrow: 'Answer override',
        description: 'Use when the source is fine but this answer misunderstood or extracted it wrongly.',
        confirmText: 'Save correction',
        meta: wrapper.dataset.question ? `Question: ${wrapper.dataset.question}` : '',
        fields: [
            { name: 'wrong_answer', label: 'Current answer', type: 'textarea', value: wrapper.dataset.wrongAnswer || '', readonly: true, rows: 5 },
            { name: 'correct_answer', label: 'Correct answer', type: 'textarea', value: '', required: true, rows: 4, placeholder: 'Enter the answer that similar future questions should prefer' },
            { name: 'field', label: 'Correction field', type: 'select', value: 'conclusion', options: getAnswerCorrectionFields() },
            { name: 'reason', label: 'Correction reason', type: 'input', value: 'direct_answer_correction', required: true }
        ]
    })
    if (!correctionInput) return
    const normalizedAnswer = String(correctionInput.correct_answer || '').trim()
    if (!normalizedAnswer) {
        alert('Correct answer cannot be empty.')
        return
    }

    const sources = Array.from(wrapper.querySelectorAll('.kb-answer-source')).map(card => {
        const textEl = card.querySelector('.kb-answer-source-text')
        return {
            doc_id: card.dataset.docId || '',
            source_doc: card.dataset.sourceDoc || '',
            summary_id: card.dataset.summaryId || '',
            chunk_id: card.dataset.chunkId || '',
            page_id: card.dataset.pageId || '',
            text: textEl ? textEl.textContent.trim() : ''
        }
    }).filter(src => src.doc_id || src.summary_id || src.chunk_id || src.text)
    try {
        btn.disabled = true
        btn.textContent = 'Saving'
        const payload = {
            question: wrapper.dataset.question || '',
            wrong_answer: wrapper.dataset.wrongAnswer || '',
            correct_answer: normalizedAnswer,
            field: String(correctionInput.field || '').trim() || 'conclusion',
            reason: String(correctionInput.reason || '').trim() || 'answer_correction',
            kb_sources: sources
        }
        await api.createAnswerCorrection(payload)
        btn.textContent = 'Corrected'
        alert('Answer correction is active. Similar future questions hitting the same evidence prefer the corrected answer.')
    } catch (err) {
        btn.textContent = 'Correct answer'
        alert('Failed to correct answer: ' + err.message)
    } finally {
        btn.disabled = false
    }
}

function getAnswerCorrectionFields() {
    return [
        { value: 'company_name', label: 'company_name (company name / owning company)' },
        { value: 'publisher', label: 'publisher (publisher / issuing body)' },
        { value: 'requirement', label: 'requirement (spec requirements / must include)' },
        { value: 'threshold', label: 'threshold (numeric threshold / min / max / mm or %)' },
        { value: 'terminology', label: 'terminology (term definition / what a word means)' },
        { value: 'applicability', label: 'applicability (scope / which molds / stages / objects)' },
        { value: 'conclusion', label: 'conclusion (general conclusion; use when hard to classify)' }
    ]
}

function openKBCorrectionDialog(config = {}) {
    return new Promise(resolve => {
        const overlay = document.createElement('div')
        overlay.className = 'kb-correction-overlay'
        const fields = config.fields || []
        const fieldHtml = fields.map(field => {
            const name = escapeAttr(field.name || '')
            const label = escapeText(field.label || '')
            const value = String(field.value ?? '')
            const required = field.required ? ' data-required="true"' : ''
            const readonly = field.readonly ? ' readonly' : ''
            const placeholder = field.placeholder ? ` placeholder="${escapeAttr(field.placeholder)}"` : ''
            if (field.type === 'select') {
                const options = (field.options || []).map(option => {
                    const selected = String(option.value) === value ? ' selected' : ''
                    return `<option value="${escapeAttr(option.value)}"${selected}>${escapeText(option.label)}</option>`
                }).join('')
                return `
                <label class="kb-correction-field">
                    <span>${label}</span>
                    <select name="${name}"${required}>${options}</select>
                </label>`
            }
            if (field.type === 'textarea') {
                return `
                <label class="kb-correction-field">
                    <span>${label}</span>
                    <textarea name="${name}" rows="${Number(field.rows || 4)}"${readonly}${required}${placeholder}>${escapeText(value)}</textarea>
                </label>`
            }
            return `
            <label class="kb-correction-field">
                <span>${label}</span>
                <input name="${name}" value="${escapeAttr(value)}"${readonly}${required}${placeholder}>
            </label>`
        }).join('')
        overlay.innerHTML = `
            <div class="kb-correction-dialog" role="dialog" aria-modal="true" aria-label="${escapeAttr(config.title || 'Knowledge correction')}">
                <div class="kb-correction-header">
                    <div class="kb-correction-header-main">
                        ${config.eyebrow ? `<span class="kb-correction-eyebrow">${escapeText(config.eyebrow)}</span>` : ''}
                        <div class="kb-correction-title">${escapeText(config.title || 'Knowledge correction')}</div>
                    </div>
                    <button type="button" class="kb-correction-close" aria-label="Close">×</button>
                </div>
                ${(config.description || config.meta) ? `
                <div class="kb-correction-subheader">
                    ${config.description ? `<div class="kb-correction-description">${escapeText(config.description)}</div>` : ''}
                    ${config.meta ? `<div class="kb-correction-meta">${escapeText(config.meta)}</div>` : ''}
                </div>` : ''}
                <div class="kb-correction-body">${fieldHtml}</div>
                <div class="kb-correction-error" hidden></div>
                <div class="kb-correction-actions">
                    <button type="button" class="kb-correction-cancel">Cancel</button>
                    <button type="button" class="kb-correction-confirm">${escapeText(config.confirmText || 'Save')}</button>
                </div>
            </div>`
        document.body.appendChild(overlay)
        const firstInput = overlay.querySelector('textarea:not([readonly]), input:not([readonly]), select')
        const errorEl = overlay.querySelector('.kb-correction-error')
        const cleanup = (value) => {
            document.removeEventListener('keydown', handleKeydown)
            overlay.remove()
            resolve(value)
        }
        const collectValues = () => {
            const values = {}
            for (const field of fields) {
                const el = Array.from(overlay.querySelectorAll('[name]')).find(input => input.name === field.name)
                const value = el ? String(el.value || '').trim() : ''
                if (field.required && !value) {
                    errorEl.hidden = false
                    errorEl.textContent = `${field.label || 'Required field'} cannot be empty`
                    el?.focus()
                    return null
                }
                values[field.name] = value
            }
            return values
        }
        const handleKeydown = (event) => {
            if (event.key === 'Escape') cleanup(null)
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                const values = collectValues()
                if (values) cleanup(values)
            }
        }
        overlay.querySelector('.kb-correction-close').addEventListener('click', () => cleanup(null))
        overlay.querySelector('.kb-correction-cancel').addEventListener('click', () => cleanup(null))
        overlay.querySelector('.kb-correction-confirm').addEventListener('click', () => {
            const values = collectValues()
            if (values) cleanup(values)
        })
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) cleanup(null)
        })
        document.addEventListener('keydown', handleKeydown)
        firstInput?.focus()
    })
}

function hasRenderableCalculation(result) {
    return Boolean(
        result &&
        result.calculation_detail &&
        Array.isArray(result.calculation_detail.parts)
    )
}

function formatMoney(value) {
    const num = Number(value || 0)
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function formatNumber(value, digits = 1) {
    const num = Number(value || 0)
    return num.toLocaleString('en-US', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    })
}

function formatFormulaRuntimeValue(field, value) {
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No'
    }
    if (Number.isFinite(Number(value))) {
        if (FORMULA_RATIO_FIELDS.has(String(field || '').trim())) {
            return `${formatNumber(Number(value) * 100, 1)}%`
        }
        return formatMoney(Number(value))
    }
    return escapeText(String(value ?? '-'))
}

function normalizeUnitPrice(value) {
    if (value === undefined || value === null || value === '') {
        return null
    }
    const num = Number(value)
    return Number.isFinite(num) ? num : null
}

function deriveUnitPrice(part) {
    const configured = normalizeUnitPrice(part?.unit_price)
    if (configured !== null) {
        return configured
    }
    const cost = Number(part?.material_cost)
    const weight = Number(part?.weight_kg)
    if (Number.isFinite(cost) && Number.isFinite(weight) && weight > 0) {
        return cost / weight
    }
    return null
}

function formatUnitPrice(value, part = null) {
    const num = normalizeUnitPrice(value) ?? deriveUnitPrice(part)
    if (num === null) {
        return 'Not configured'
    }
    return `${formatNumber(num, 0)} CNY/kg`
}

function formatMaterialUnitPrice(value, part = null) {
    const num = normalizeUnitPrice(value) ?? deriveUnitPrice(part)
    if (num === null) {
        return 'Not configured'
    }
    return `${formatNumber(num, 0)} CNY/kg`
}

async function loadMaterialLibrary() {
    materialPriceTable = {}
    rerenderCalculationHistoryMessages()
}

function normalizeMaterialPriceTable(table) {
    return Object.entries(table || {}).reduce((acc, [material, price]) => {
        const name = String(material || '').trim()
        const num = Number(price)
        if (name && Number.isFinite(num)) {
            acc[name] = num
        }
        return acc
    }, {})
}

function getMaterialPriceTable(detail, parts) {
    const materialRows = Array.isArray(detail?.material_detail) ? detail.material_detail : []
    const table = {
        ...normalizeMaterialPriceTable(materialPriceTable),
        ...normalizeMaterialPriceTable(detail?.material_price_table || {})
    }
    ;[...(parts || []), ...materialRows].forEach(part => {
        const material = String(part?.material || '').trim()
        const unitPrice = deriveUnitPrice(part)
        if (material && unitPrice !== null && table[material] === undefined) {
            table[material] = unitPrice
        }
    })
    return table
}

function formatMaterialOptionLabel(material, table) {
    const unitPrice = findMaterialUnitPrice(material, table)
    const priceText = unitPrice !== null ? `${formatNumber(unitPrice, 0)}CNY/kg` : 'Unit price not configured'
    return `${material} ${priceText}`
}

function getMaterialOptions(selectedMaterial, table) {
    const selected = String(selectedMaterial || '').trim()
    const materials = Object.keys(table || {}).sort((a, b) => a.localeCompare(b, 'en-US'))
    if (selected && !materials.includes(selected)) {
        materials.unshift(selected)
    }
    return materials
}

function renderMaterialOptions(selectedMaterial, table) {
    const selected = String(selectedMaterial || '').trim()
    return getMaterialOptions(selectedMaterial, table).map(material => {
        const optionText = formatMaterialOptionLabel(material, table)
        const activeClass = material === selected ? ' is-active' : ''
        return `
            <button
                type="button"
                class="material-dropdown-item${activeClass}"
                role="menuitem"
                data-value="${escapeAttr(material)}"
            >${escapeText(optionText)}</button>
        `
    }).join('')
}

function renderMaterialSelect(part, index, materialTable) {
    const selected = String(part?.material || '').trim()
    const label = selected
        ? formatMaterialOptionLabel(selected, materialTable)
        : 'Select material'
    return `
        <div class="material-select-cell">
            <div class="material-select-menu">
                <button
                    type="button"
                    class="material-select"
                    data-part-index="${index}"
                    data-value="${escapeAttr(selected)}"
                    title="Select material"
                    aria-haspopup="true"
                    aria-expanded="false"
                >
                    <span class="material-select-label">${escapeText(label)}</span>
                    <svg class="material-select-caret" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                        <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                </button>
                <div class="material-dropdown hidden" role="menu">
                    ${renderMaterialOptions(selected, materialTable)}
                </div>
            </div>
        </div>
    `
}

function findMaterialUnitPrice(material, table) {
    const target = String(material || '').trim()
    if (!target) return null
    if (table[target] !== undefined) {
        return normalizeUnitPrice(table[target])
    }
    const normalizedTarget = target.toUpperCase()
    const matchedKey = Object.keys(table || {}).find(key => String(key).trim().toUpperCase() === normalizedTarget)
    return matchedKey ? normalizeUnitPrice(table[matchedKey]) : null
}

function rerenderCalculationHistoryMessages() {
    chatHistory.forEach(item => {
        if (hasRenderableCalculation(item?.result)) {
            rerenderHistoryMessage(item)
        }
    })
}

function isAdminUser() {
    return (currentUser?.role || localStorage.getItem('role')) === 'admin'
}

function canEditKBContent() {
    const role = currentUser?.role || localStorage.getItem('role')
    return role === 'admin' || role === 'editor'
}

function renderHitlConfirmation(result) {
    const hitl = result?.hitl_confirmation
    if (!hitl) {
        return ''
    }

    const status = hitl.confirmed ? 'confirmed' : hitl.cancelled ? 'cancelled' : 'pending'
    const statusText = status === 'confirmed'
        ? 'Confirmed; you can continue saving the rule'
        : status === 'cancelled'
            ? 'This Skill change suggestion was cancelled'
            : 'Please confirm this Skill change suggestion'
    const shouldLocalizeMaterialDetailText = !(hitl?.mode === 'rule_table_update' && hitl?.operation === 'rename_row')
    const localizedFieldDisplay = localizeMaterialDetailText(hitl.field_display || hitl.skill_name || '', result?.calculation_detail || {})
    const localizedFieldValue = shouldLocalizeMaterialDetailText ? localizeMaterialDetailText(hitl.field_value || '-', result?.calculation_detail || {}) : String(hitl.field_value || '-')
    const localizedHitlMessage = shouldLocalizeMaterialDetailText ? localizeMaterialDetailText(hitl.message || '', result?.calculation_detail || {}) : String(hitl.message || '')
    const localizedHitlTip = shouldLocalizeMaterialDetailText ? localizeMaterialDetailText(hitl.tip || '', result?.calculation_detail || {}) : String(hitl.tip || '')
    const fieldLabel = getFormulaDisplayName(localizedFieldDisplay || hitl.skill_name || '')
    const finalLocalizedHitlTip = shouldLocalizeMaterialDetailText ? localizedHitlTip : String(hitl?.tip || '')
    const fieldValue = translateHitlText(localizedFieldValue)
    const messageText = translateHitlText(localizedHitlMessage)
    const tipText = translateHitlText(finalLocalizedHitlTip)

    return `
        <div class="hitl-box" data-hitl-status="${status}">
            <div class="hitl-title">Skill change confirmation</div>
            <div class="hitl-message">${escapeHtml(messageText)}</div>
            <div class="hitl-meta">
                <span>Field: ${escapeText(fieldLabel || '-')}</span>
                <span>Target: ${escapeText(fieldValue)}</span>
            </div>
            <div class="hitl-status">${escapeText(statusText)}</div>
            <div class="hitl-actions">
                <button type="button" class="hitl-btn hitl-confirm-btn" ${status !== 'pending' ? 'disabled' : ''}>Confirm</button>
                <button type="button" class="hitl-btn hitl-cancel-btn" ${status !== 'pending' ? 'disabled' : ''}>Cancel</button>
            </div>
            <div class="hitl-tip">${escapeText(tipText)}</div>
        </div>
    `
}

function buildHitlSecondMessageHtml(hitl, questionText = '', result = null) {
    const detail = result?.calculation_detail || {}
    const shouldLocalizeMaterialDetailText = !(hitl?.mode === 'rule_table_update' && hitl?.operation === 'rename_row')
    const localizedFieldDisplay = localizeMaterialDetailText(hitl?.field_display || hitl?.skill_name || '', detail)
    const localizedFieldValue = shouldLocalizeMaterialDetailText ? localizeMaterialDetailText(hitl?.field_value || '', detail) : String(hitl?.field_value || '')
    const localizedConfirmQuestion = shouldLocalizeMaterialDetailText ? localizeMaterialDetailText(hitl?.confirm_question || '', detail) : String(hitl?.confirm_question || '')
    const backendConfirmQuestion = translateHitlText(localizedConfirmQuestion)
    const localizedQuestionText = shouldLocalizeMaterialDetailText ? localizeMaterialDetailText(questionText || hitl?.message || '', detail) : String(questionText || hitl?.message || '')
    const localizedHitlReflection = shouldLocalizeMaterialDetailText ? localizeMaterialDetailText(hitl?.reflection || hitl?.reflection_payload?.reflection || '', detail) : String(hitl?.reflection || hitl?.reflection_payload?.reflection || '')
    const localizedHitlTip = localizeMaterialDetailText(hitl?.tip || 'Confirm to apply immediately; Cancel leaves it unchanged.', detail)
    const fieldLabel = getFormulaDisplayName(localizedFieldDisplay || hitl?.skill_name || '', 'Parameter change')
    const fieldValue = translateHitlText(localizedFieldValue)
    const confirmQuestion = fieldLabel && fieldValue
        ? `Confirm changing ${fieldLabel} to ${fieldValue}?`
        : translateHitlText(localizedQuestionText)
    const effectiveConfirmQuestion = backendConfirmQuestion || confirmQuestion
    const reflectionText = translateHitlText(localizedHitlReflection)
    const tipText = translateHitlText(localizedHitlTip)
    const status = hitl?.confirmed ? 'confirmed' : hitl?.cancelled ? 'cancelled' : 'pending'
    const statusText = status === 'confirmed'
        ? 'Changed'
        : status === 'cancelled'
            ? 'Unchanged'
            : 'Confirm this change?'

    return `
        <div class="hitl-confirm-box" data-hitl-status="${status}">
            <div class="hitl-card">
                <div class="hitl-card-header">
                    <span class="hitl-title">Parameter change confirmation</span>
                    <span class="hitl-badge">${escapeText(fieldLabel)}</span>
                </div>
                <div class="hitl-card-body">
                    <div class="hitl-section">
                        <div class="hitl-section-label">Attribution analysis</div>
                        <div class="hitl-content-box">${escapeHtml(reflectionText)}</div>
                    </div>
                    <div class="hitl-section">
                        <div class="hitl-section-label">Please confirm</div>
                        <div class="hitl-confirm-question">${escapeHtml(effectiveConfirmQuestion)}</div>
                    </div>
                </div>
                <div class="hitl-card-footer">
                    <div class="hitl-status">${escapeText(statusText)}</div>
                    <div class="hitl-buttons">
                        <button type="button" class="hitl-btn hitl-btn-cancel hitl-cancel-btn" ${status !== 'pending' ? 'disabled' : ''}>Cancel</button>
                        <button type="button" class="hitl-btn hitl-btn-confirm hitl-confirm-btn" ${status !== 'pending' ? 'disabled' : ''}>Confirm change</button>
                    </div>
                    <div class="hitl-tip">${escapeText(tipText)}</div>
                </div>
            </div>
        </div>
    `
}

function formatCavityArrangementValue(cavityCount, cavityLayout = {}) {
    const count = Number(cavityCount || cavityLayout.cavity_count || 1)
    if (count <= 1) {
        return 'None'
    }

    const arrangement = String(cavityLayout.arrangement || '').trim()
    const arrangementLabelMap = {
        length: 'Arrange by length',
        width: 'Arrange by width',
        height: 'Arrange by height',
        planar: 'L×W arrangement',
        volumetric: 'L×W×H arrangement'
    }
    if (arrangementLabelMap[arrangement]) {
        return arrangementLabelMap[arrangement]
    }
    if (arrangement && arrangement !== 'single') {
        return arrangement
    }

    return 'Arrange by length'
}

function formatCavitySpacingValue(cavityCount, cavityLayout = {}) {
    const count = Number(cavityCount || cavityLayout.cavity_count || 1)
    if (count <= 1) {
        return 'None'
    }
    return `${formatNumber(cavityLayout.spacing || 0, 0)} mm`
}

function renderCalculationResult(result, content) {
    const detail = result.calculation_detail || {}
    const parts = detail.parts || []
    const materialDetail = Array.isArray(detail.material_detail) ? detail.material_detail : []
    const materialRows = materialDetail.length ? materialDetail : parts
    const dimensionTraces = detail.dimension_traces || {}
    const formulaTraces = detail.formula_traces || {}
    const effectiveFormulaSources = detail.effective_formula_sources || {}
    const totalMaterial = materialRows.reduce((sum, part) => sum + Number(part.material_cost || 0), 0)
    const ratio = Number(detail.material_ratio || 0)
    const difficulty = Number(detail.difficulty_factor || 1)
    const total = Number(result.mold_price || 0)
    const moldType = detail.mold_type || 'injection'
    const moldTypeLabel = getMoldTypeDisplayName(moldType)
    const cavityLayout = detail.cavity_layout || {}
    const materialTable = getMaterialPriceTable(detail, parts)
    const sizeText = [detail.part_length, detail.part_width, detail.part_height]
        .filter(v => v !== undefined && v !== null)
        .map(v => formatNumber(v, 0))
        .join(' × ')

    const partFieldPrefixMap = {
        'Cavity Insert': 'cavity',
        'Core Insert': 'core',
        'Cavity Plate': 'fix_plate',
        'Core Plate': 'move_plate',
        'Top Plate': 'top_plate',
        'Hot Runner Plate': 'hotrunner_plate',
        'Hot Runner Plate': 'hotrunner_plate',
        'Ejector Plate 1': 'ejector_plate1',
        'Ejector Plate 2': 'ejector_plate2',
        'Mold Foot': 'mold_foot',
        'Bottom Plate': 'bottom_plate',
        'Cavity Insert': 'cavity',
        'Core Insert': 'core',
        'Cavity Plate': 'fix_plate',
        'Core Plate': 'move_plate',
        'Top Plate': 'top_plate',
        'Hot Runner Plate': 'hotrunner_plate',
        'Ejector Plate 1': 'ejector_plate1',
        'Ejector Plate 2': 'ejector_plate2',
        'Mold Foot': 'mold_foot',
        'Bottom Plate': 'bottom_plate'
    }
    const dimensionFieldNameMap = {
        length: 'length',
        width: 'width',
        height: 'height'
    }
    const resolveDimensionTargetField = (part, field) => {
        const rowKey = typeof part === 'object' ? String(part?.row_key || '').trim() : ''
        const partName = typeof part === 'object'
            ? (part?.source_name || part?.original_name || part?.system_name || part?.name)
            : part
        const dim = dimensionFieldNameMap[field]
        if (rowKey && dim) {
            return `${rowKey}_${dim}`
        }
        const prefix = partFieldPrefixMap[String(partName || '').trim()]
        if (!prefix || !dim) {
            return null
        }
        return `${prefix}_${dim}`
    }
    const buildRuntimeDimensionTrace = (part, field) => {
        const targetField = resolveDimensionTargetField(part, field)
        if (!targetField) {
            return null
        }
        const sourceMeta = effectiveFormulaSources?.[targetField] || {}
        const trace = formulaTraces?.[targetField] || {}
        const sourceType = String(
            sourceMeta.rule_source_type
            || sourceMeta.source
            || sourceMeta.asset_source
            || sourceMeta.source_type
            || ''
        ).trim()
        const hasRuntimeTrace = Boolean(trace?.expression || trace?.formula)
        if (!hasRuntimeTrace && !sourceType) {
            return null
        }
        if (sourceType === 'default_migrated') {
            return null
        }
        const displayName = getFormulaDisplayName(
            targetField,
            trace?.display_name || sourceMeta.display_name || `${part?.name || ''}${field}`
        )
        const expression = localizeMaterialDetailText(trace?.expression || trace?.formula || targetField, detail)
        const displayExpression = translateFormulaExpression(expression)
        const value = Number.isFinite(Number(trace?.value)) ? Number(trace.value) : Number(part?.[field] || 0)
        return {
            formula: `${displayName} = ${displayExpression} = ${formatNumber(value, 2)}`,
            is_custom: true
        }
    }
    const hasBackendFormulaSource = (part, field) => {
        const targetField = resolveDimensionTargetField(part, field)
        if (!targetField) {
            return false
        }
        return Boolean(effectiveFormulaSources?.[targetField] || formulaTraces?.[targetField])
    }

    const localizeMaterialDetailFormulaText = (formulaText, part, field) => {
        let text = String(formulaText || '')
        if (!text) {
            return text
        }
        const tracePartName = part?.source_name || part?.original_name || part?.system_name || part?.name
        const targetField = resolveDimensionTargetField(part, field)
        const dimLabelMap = { length: 'Length', width: 'Width', height: 'Height' }
        const dimLabel = dimLabelMap[field] || ''
        const sourceLabel = tracePartName ? `${String(tracePartName)}${dimLabel}` : ''
        const fallbackDisplayLabel = `${String(part?.name || tracePartName || '')}${dimLabel}`
        const displayLabel = isReadableChineseText(fallbackDisplayLabel)
            ? fallbackDisplayLabel
            : getFormulaDisplayName(targetField, fallbackDisplayLabel)
        if (tracePartName && part?.name && tracePartName !== part.name) {
            text = text.replaceAll(String(tracePartName), String(part.name))
        }
        if (targetField && displayLabel) {
            text = text.replaceAll(String(targetField), String(displayLabel))
        }
        if (sourceLabel && displayLabel && sourceLabel !== displayLabel) {
            text = text.replaceAll(String(sourceLabel), String(displayLabel))
        }
        return localizeMaterialDetailText(text, detail)
    }

    const renderDimensionCell = (part, field) => {
        const tracePartName = part?.source_name || part?.original_name || part?.system_name || part?.name
        const backendTrace = dimensionTraces?.[tracePartName]?.[field] || null
        const runtimeTrace = buildRuntimeDimensionTrace(part, field)
        const hasRuntimeBackedField = hasBackendFormulaSource(part, field)
        const trace = (
            ((backendTrace && backendTrace.is_custom) ? backendTrace : null)
            || (hasRuntimeBackedField ? runtimeTrace : null)
            || backendTrace
            || (!hasRuntimeBackedField ? buildExcelDimensionTrace(part, field, detail, parts) : null)
        )
        const value = formatNumber(part[field], 0)
        if (!trace || !trace.formula) {
            return `<td>${value}</td>`
        }
        const displayedFormula = localizeMaterialDetailFormulaText(trace.formula, part, field)
        const title = escapeAttr(translateFormulaText(displayedFormula))
        const customClass = trace.is_custom ? ' dimension-cell custom-dimension' : ' dimension-cell'
        return `<td><span class="${customClass}" title="${title}">${value}</span></td>`
    }

    const partRows = materialRows.map((part, index) => `
        <tr>
            <td>${escapeText(localizePartDisplayName(part.name))}</td>
            ${renderDimensionCell(part, 'length')}
            ${renderDimensionCell(part, 'width')}
            ${renderDimensionCell(part, 'height')}
            <td>
                ${renderMaterialSelect(part, index, materialTable)}
            </td>
            <td>${formatNumber(part.weight_kg ?? part.weight, 1)}</td>
            <td class="amount-cell">¥${formatMoney(part.material_cost)}</td>
        </tr>
    `).join('')

    const materialPriceRows = Object.values(parts.reduce((acc, part) => {
        const material = part.material || 'Unknown material'
        const unitPrice = deriveUnitPrice(part)
        const key = `${material}-${unitPrice ?? 'missing'}`
        if (!acc[key]) {
            acc[key] = {
                material,
                unitPrice,
                partNames: []
            }
        }
        acc[key].partNames.push(localizePartDisplayName(part.name))
        return acc
    }, {})).map(item => `
        <tr>
            <td>${escapeText(item.material)}</td>
            <td>${formatMaterialUnitPrice(item.unitPrice)}</td>
            <td>${escapeText(item.partNames.join(', '))}</td>
        </tr>
    `).join('')

    const feeTraceTitle = (field, fallbackValue) => {
        const trace = formulaTraces[field] || {}
        const isFixedStandardPartsCost = field === 'standard_parts_cost'
            && String(detail.standard_parts_cost_mode || '').trim().toLowerCase() === 'fixed'
        const resolvedValue = isFixedStandardPartsCost
            ? fallbackValue
            : (trace.value !== undefined ? trace.value : fallbackValue)
        if (isFixedStandardPartsCost || (!trace?.expression && !trace?.formula)) {
            return `${getFormulaDisplayName(field)} = ¥${formatMoney(resolvedValue)}`
        }
        const expression = translateFormulaText(trace.expression || trace.formula)
        return `${getFormulaDisplayName(field)} = ${expression} = ¥${formatMoney(resolvedValue)}`
    }
    const fees = [
        { name: 'Electrode cost', field: 'electrode_cost', value: detail.electrode_cost },
        { name: 'Slider cost', field: 'slider_cost', value: detail.slider_cost },
        { name: 'Hot runner cost', field: 'hotrunner_cost', value: detail.hotrunner_cost },
        { name: 'High-gloss/polish cost', field: 'polishing_cost', value: detail.polishing_cost },
        { name: 'Texture cost', field: 'texture_cost', value: detail.texture_cost },
        { name: 'Oil cylinder cost', field: 'oil_cylinder_cost', value: detail.oil_cylinder_cost },
        { name: 'Standard parts cost', field: 'standard_parts_cost', value: detail.standard_parts_cost },
        { name: 'Other costs', field: 'other_cost', value: detail.other_cost }
    ]

    const feeRows = fees.map(({ name, field, value }) => {
        const trace = formulaTraces[field] || {}
        const isFixedStandardPartsCost = field === 'standard_parts_cost'
            && String(detail.standard_parts_cost_mode || '').trim().toLowerCase() === 'fixed'
        const resolvedValue = isFixedStandardPartsCost ? value : (trace.value !== undefined ? trace.value : value)
        return `
        <tr>
            <td>${name}</td>
            <td class="amount-cell"><span class="dimension-cell" title="${escapeAttr(feeTraceTitle(field, resolvedValue))}">¥${formatMoney(resolvedValue)}</span></td>
        </tr>
    `
    }).join('')

    const paramItems = [
        { label: 'Material ratio', field: 'material_ratio', value: `${formatNumber(ratio * 100, 1)}%` },
        { label: 'Difficulty factor', field: 'difficulty_factor', value: formatNumber(difficulty, 2) },
        { label: 'Cavity count', field: 'cavity_count', value: formatNumber(detail.cavity_count || 1, 0) },
        { label: 'Hot runner points', field: 'hotrunner_points', value: formatNumber(detail.hotrunner_points || 0, 0) },
        { label: 'Hot runner unit price', field: 'hotrunner_point_cost', value: `${formatNumber(detail.hotrunner_point_cost || 0, 0)} CNY/point` },
        { label: 'Electrode weight', field: 'electrode_weight', value: `${formatNumber(detail.electrode_weight || 0, 2)} kg` },
        { label: 'Electrode unit price', field: 'electrode_unit_price', value: `${formatNumber(detail.electrode_unit_price || 0, 0)} CNY/kg` },
        { label: 'Surface area', field: 'surface_area_cm2', value: `${formatNumber(detail.surface_area_cm2 || 0, 2)} cm²` },
        { label: 'High-gloss/polish unit price', field: 'polishing_unit_price', value: `${formatNumber(detail.polishing_unit_price || 0, 0)} CNY/cm²` },
        { label: 'Texture unit price', field: 'texture_unit_price', value: `${formatNumber(detail.texture_unit_price || 0, 0)} CNY/cm²` },
        { label: 'Oil cylinder count', field: 'oil_cylinder_count', value: formatNumber(detail.oil_cylinder_count || 0, 0) },
        { label: 'Oil cylinder unit price', field: 'oil_cylinder_unit_price', value: `${formatNumber(detail.oil_cylinder_unit_price || 0, 0)} CNY/pc` },
        { label: 'Standard parts ratio', field: 'standard_parts_ratio', value: `${formatNumber((detail.standard_parts_ratio || 0) * 100, 1)}%` },
        { label: 'Surface requirement', field: 'surface_requirement', value: formatSurfaceRequirement(detail.surface_requirement) },
        { label: 'Top slide insert', field: 'has_slider', value: detail.has_slider ? 'Yes' : 'None' },
        { label: 'Other requirements', field: 'other_requirement', value: formatOtherRequirement(detail.other_requirement) }
    ]
    paramItems.splice(
        3,
        0,
        { label: 'Cavity arrangement', field: 'cavity_arrangement', value: formatCavityArrangementValue(detail.cavity_count, cavityLayout) },
        { label: 'Cavity spacing', field: 'cavity_spacing', value: formatCavitySpacingValue(detail.cavity_count, cavityLayout) }
    )
    const paramTraceTitle = (field, label, value) => {
        const trace = formulaTraces?.[field]
        if (!trace?.expression && !trace?.formula) {
            return ''
        }
        const expression = translateFormulaExpression(localizeMaterialDetailText(trace.expression || trace.formula, detail))
        const traceValue = trace.value !== undefined ? trace.value : value
        return `${label} = ${expression} = ${traceValue}`
    }
    const paramGrid = paramItems.map(({ label, field, value }) => {
        const traceTitle = paramTraceTitle(field, label, value)
        const formulaClass = traceTitle ? ' quote-param-item-formula' : ''
        const titleAttr = traceTitle ? ` title="${escapeAttr(traceTitle)}"` : ''
        const fieldAttr = field ? ` data-formula-field="${escapeAttr(field)}"` : ''
        return `
        <div class="quote-param-item${formulaClass}"${fieldAttr}${titleAttr}>
            <div class="quote-param-label">${escapeText(label)}</div>
            <div class="quote-param-value">${escapeText(value)}</div>
        </div>
    `
    }).join('')

    const correctionTip = content && content.includes('continue editing')
        ? '<div class="quote-tip">You can keep editing parameters.</div>'
        : ''
    const formulaOpen = result.formula_open ? ' open' : ''
    const formulaPanelStyle = result.formula_open ? '' : ' hidden'
    const formulaRuntimeHtml = renderFormulaRuntimePanels(result)

    return `
        <div class="quote-report">
            <div class="quote-summary formula-toggle${formulaOpen}" role="button" tabindex="0" title="Click to expand calculation formulas">
                <div>
                    <div class="quote-summary-label">Total mold amount</div>
                    <div class="quote-summary-meta">${escapeText(moldTypeLabel)}${sizeText ? ` · ${sizeText} mm` : ''}</div>
                </div>
                <div class="quote-total-wrap">
                    <div class="quote-total">¥${formatMoney(total)}</div>
                    <div class="quote-toggle-hint">${result.formula_open ? 'Collapse formulas' : 'Expand formulas'}</div>
                </div>
            </div>

            <div class="quote-section-title">Material cost breakdown</div>
            <div class="quote-table-wrap">
                <table class="quote-table">
                    <thead>
                        <tr>
                            <th>Part</th>
                            <th>L</th>
                            <th>W</th>
                            <th>H</th>
                            <th>Material</th>
                            <th>Weight kg</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${partRows}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="6">Material cost total</td>
                            <td class="amount-cell">¥${formatMoney(totalMaterial)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div class="quote-grid">
                <div class="quote-panel-block">
                    <div class="quote-section-title">Surcharges</div>
                    <div class="quote-panel">
                        <table class="quote-table quote-fee-table">
                            <thead>
                                <tr>
                                    <th>Cost type</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>${feeRows}</tbody>
                        </table>
                    </div>
                </div>
                <div class="quote-panel-block">
                    <div class="quote-section-title">Calc params</div>
                    <div class="quote-panel">
                        <div class="quote-params-header">
                            <div class="quote-params-header-item">
                                <span class="quote-params-header-label">Param type</span>
                                <span class="quote-params-header-value">Value</span>
                            </div>
                            <div class="quote-params-header-item">
                                <span class="quote-params-header-label">Param type</span>
                                <span class="quote-params-header-value">Value</span>
                            </div>
                        </div>
                        <div class="quote-params-grid">${paramGrid}</div>
                    </div>
                </div>
            </div>

            <div class="formula-panel${formulaPanelStyle}">
                ${formulaRuntimeHtml}
            </div>
            ${correctionTip}
        </div>
    `
}

function formatSurfaceRequirement(value) {
    if (value === 'high_gloss') return 'High-gloss'
    if (value === 'texture') return 'texture'
    return value || 'Normal'
}

function formatOtherRequirement(value) {
    const text = String(value ?? '').trim()
    return text || 'None'
}

const EXCEL_DIMENSION_RULES = {
    'Cavity Insert': {
        length: { cell: 'C7', expr: '=C3+120', calc: ctx => ctx.input('part_length', 'Part L')?.plus(120) },
        width: { cell: 'D7', expr: '=D3+120', calc: ctx => ctx.input('part_width', 'Part W')?.plus(120) },
        height: { cell: 'E7', expr: '=E3+40', calc: ctx => ctx.input('part_height', 'Part H')?.plus(40) }
    },
    'Core Insert': {
        length: { cell: 'C8', expr: '=C7', calc: ctx => ctx.part('Cavity Insert', 'length') },
        width: { cell: 'D8', expr: '=D7', calc: ctx => ctx.part('Cavity Insert', 'width') },
        height: { cell: 'E8', expr: '=E3+40', calc: ctx => ctx.input('part_height', 'Part H')?.plus(40) }
    },
    'Cavity Plate': {
        length: { cell: 'C9', expr: '=C7+200', calc: ctx => ctx.part('Cavity Insert', 'length')?.plus(200) },
        width: { cell: 'D9', expr: '=D7+200', calc: ctx => ctx.part('Cavity Insert', 'width')?.plus(200) },
        height: { cell: 'E9', expr: '=E7+40', calc: ctx => ctx.part('Cavity Insert', 'height')?.plus(40) }
    },
    'Core Plate': {
        length: { cell: 'C10', expr: '=C8+200', calc: ctx => ctx.part('Core Insert', 'length')?.plus(200) },
        width: { cell: 'D10', expr: '=D9', calc: ctx => ctx.part('Cavity Plate', 'width') },
        height: { cell: 'E10', expr: '=E8+40', calc: ctx => ctx.part('Core Insert', 'height')?.plus(40) }
    },
    'Top Plate': {
        length: { cell: 'C11', expr: '=C9', calc: ctx => ctx.part('Cavity Plate', 'length') },
        width: { cell: 'D11', expr: '=D9+200', calc: ctx => ctx.part('Cavity Plate', 'width')?.plus(200) },
        height: { cell: 'E11', expr: '=40', calc: ctx => ctx.fixed(40) }
    },
    'Hot Runner Plate': {
        length: { cell: 'C12', expr: '=C9', calc: ctx => ctx.part('Cavity Plate', 'length') },
        width: { cell: 'D12', expr: '=D11', calc: ctx => ctx.part('Top Plate', 'width') },
        height: { cell: 'E12', expr: '=80', calc: ctx => ctx.fixed(80) }
    },
    'Ejector Plate 1': {
        length: { cell: 'C13', expr: '=C7', calc: ctx => ctx.part('Cavity Insert', 'length') },
        width: { cell: 'D13', expr: '=D7', calc: ctx => ctx.part('Cavity Insert', 'width') },
        height: { cell: 'E13', expr: '=30', calc: ctx => ctx.fixed(30) }
    },
    'Ejector Plate 2': {
        length: { cell: 'C14', expr: '=C7', calc: ctx => ctx.part('Cavity Insert', 'length') },
        width: { cell: 'D14', expr: '=D13', calc: ctx => ctx.part('Ejector Plate 1', 'width') },
        height: { cell: 'E14', expr: '=30', calc: ctx => ctx.fixed(30) }
    },
    'Mold Foot': {
        length: { cell: 'C15', expr: '=609', calc: ctx => ctx.fixed(609) },
        width: { cell: 'D15', expr: '=C15*0.15', calc: ctx => ctx.part('Mold Foot', 'length')?.times(0.15) },
        height: {
            cell: 'E15',
            expr: '=E14+E13+E3*0.5',
            calc: ctx => ctx.part('Ejector Plate 2', 'height')?.plusRef(ctx.part('Ejector Plate 1', 'height'))?.plusRef(ctx.input('part_height', 'Part H')?.times(0.5))
        }
    },
    'Bottom Plate': {
        length: { cell: 'C16', expr: '=609', calc: ctx => ctx.fixed(609) },
        width: { cell: 'D16', expr: '=D11', calc: ctx => ctx.part('Top Plate', 'width') },
        height: { cell: 'E16', expr: '=40', calc: ctx => ctx.fixed(40) }
    }
}

function buildExcelDimensionTrace(part, field, detail, parts) {
    const value = Number(part?.[field])
    if (!Number.isFinite(value)) return null
    const dimLabel = { length: 'L', width: 'W', height: 'H' }[field] || field
    const rule = EXCEL_DIMENSION_RULES[part?.name]?.[field]
    if (!rule) return null
    const ctx = createExcelTraceContext(detail, parts)
    const trace = rule.calc(ctx)
    if (!trace) return null

    const expected = trace.value
    const expectedText = Number.isFinite(expected) ? formatFormulaNumber(expected) : 'Unknown'
    const actualText = formatFormulaNumber(value)
    const diff = Number.isFinite(expected) ? value - expected : 0
    const diffText = diff >= 0 ? `+${formatFormulaNumber(diff)}` : formatFormulaNumber(diff)
    const overrideText = Number.isFinite(expected) && Math.abs(diff) > 0.5
        ? `; currently using=${actualText} (overridden by correction rules; deviation from base rule ${diffText})`
        : `; current result=${actualText}`

    return {
        formula: `${part.name}${dimLabel} = ${trace.text} = ${expectedText}${overrideText}`,
        is_custom: Number.isFinite(expected) && Math.abs(diff) > 0.5
    }
}

function createExcelTraceContext(detail, parts) {
    const partByName = name => parts.find(item => item.name === name) || null
    const makeTraceValue = (value, text) => {
        const numeric = Number(value)
        if (!Number.isFinite(numeric)) return null
        return {
            value: numeric,
            text,
            plus(offset) {
                const sign = offset >= 0 ? '+' : ''
                return makeTraceValue(numeric + offset, `${text}${sign}${formatFormulaNumber(offset)}`)
            },
            times(factor) {
                return makeTraceValue(numeric * factor, `${text}*${formatFormulaNumber(factor, 2)}`)
            },
            plusRef(other) {
                if (!other) return null
                return makeTraceValue(numeric + other.value, `${text}+${other.text}`)
            }
        }
    }
    return {
        fixed(value) {
            return makeTraceValue(value, formatFormulaNumber(value))
        },
        input(key, label) {
            return makeTraceValue(detail?.[key], `${label}(${formatFormulaNumber(detail?.[key])})`)
        },
        part(name, field) {
            const target = partByName(name)
            const dimLabel = { length: 'L', width: 'W', height: 'H' }[field] || field
            return makeTraceValue(target?.[field], `${name}${dimLabel}(${formatFormulaNumber(target?.[field])})`)
        }
    }
}

function formatFormulaNumber(value, digits = 0) {
    const num = Number(value)
    if (!Number.isFinite(num)) return 'Unknown'
    return num.toLocaleString('en-US', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    })
}

function renderMaterialSelectionBasis(basis = {}) {
    const recommended = basis.recommended || null
    const factors = basis.input_factors || {}
    const warnings = basis.warnings || []
    const sourceSections = basis.source_sections || []
    if (!recommended && sourceSections.length === 0) {
        return ''
    }
    const recommendationText = recommended
        ? `Cavity Insert ${escapeText(recommended.cavity_material || '-')}, Core Insert ${escapeText(recommended.core_material || '-')}`
        : 'Missing dimension/resin/appearance class; no firm recommendation yet'
    const factorText = [
        factors.appearance === true ? 'Appearance part' : factors.appearance === false ? 'Non-appearance part' : '',
        factors.category ? formatMaterialCategory(factors.category) : '',
        factors.production_volume ? `Volume ${formatNumber(factors.production_volume, 0)}` : ''
    ].filter(Boolean).join(' · ')
    return `
        <div class="material-basis-box">
            <div class="quote-section-title">Material selection basis</div>
            <div class="material-basis-main">${recommendationText}</div>
            <div class="material-basis-meta">${escapeText(factorText || 'Per QIM 706501B-2021, only recognized rules are shown')}</div>
            ${warnings.length ? `<div class="material-basis-warning">${escapeText(warnings.join('; '))}</div>` : ''}
        </div>
    `
}

function formatMaterialCategory(value) {
    const labels = {
        high_gloss: 'High-gloss / piano finish',
        texture: 'texture',
        optical_transparent: 'Optical transparent',
        pc_abs: 'PC/ABS',
        pp: 'PP'
    }
    return labels[value] || value
}

function renderFormulaRuntimePanels(result = {}) {
    const detail = result?.calculation_detail || {}
    const formulaTraces = detail.formula_traces || {}
    const effectiveSources = detail.effective_formula_sources || {}
    const cavityLayout = detail.cavity_layout || {}
    const calculationParams = [
        ['material_ratio', detail.material_ratio],
        ['difficulty_factor', detail.difficulty_factor],
        ['cavity_count', detail.cavity_count],
        ['cavity_arrangement', formatCavityArrangementValue(detail.cavity_count, cavityLayout)],
        ['cavity_spacing', formatCavitySpacingValue(detail.cavity_count, cavityLayout)],
        ['hotrunner_points', detail.hotrunner_points],
        ['hotrunner_point_cost', detail.hotrunner_point_cost],
        ['electrode_weight', detail.electrode_weight],
        ['electrode_unit_price', detail.electrode_unit_price],
        ['surface_area_cm2', detail.surface_area_cm2],
        ['polishing_unit_price', detail.polishing_unit_price],
        ['texture_unit_price', detail.texture_unit_price],
        ['oil_cylinder_count', detail.oil_cylinder_count],
        ['oil_cylinder_unit_price', detail.oil_cylinder_unit_price],
        ['standard_parts_ratio', detail.standard_parts_ratio],
        ['surface_requirement', formatSurfaceRequirement(detail.surface_requirement)],
        ['has_slider', detail.has_slider]
    ]
    const traceEntries = Object.entries(formulaTraces || {}).filter(([field]) =>
        !HIDDEN_FORMULA_TRACE_FIELDS.has(String(field || '').trim())
    )
    const mergedRows = traceEntries.map(([field, trace]) => ({
        field,
        trace,
        sourceMeta: effectiveSources?.[field] || {}
    }))

    calculationParams.forEach(([field, value]) => {
        if (value === undefined || value === null || formulaTraces?.[field]) {
            return
        }
        mergedRows.push({
            field,
            trace: {
                display_name: getFormulaDisplayName(field, field),
                value
            },
            sourceMeta: { source: 'runtime' }
        })
    })

    if (!mergedRows.length) {
        return ''
    }

    const sourceLabelMap = FORMULA_SOURCE_NAME_MAP

    const rows = mergedRows.map(({ field, trace, sourceMeta }) => {
        const expression = formatFormulaRuntimeExpression(field, trace, sourceMeta, detail)
        const value = trace?.value
        const sourceType = (
            sourceMeta.rule_source_type
            || sourceMeta.source
            || sourceMeta.asset_source
            || sourceMeta.source_type
            || ''
        )
        const sourceText = sourceLabelMap[sourceType] || (sourceType ? 'Unknown source' : '-')
        const localizedDisplayName = localizeMaterialDetailText(trace?.display_name || sourceMeta.display_name || field, detail)
        const displayName = getFormulaDisplayName(field, localizedDisplayName)
        const valueText = formatFormulaRuntimeValue(field, value)

        return `
            <tr data-formula-row="${escapeAttr(field)}">
                <td>${escapeText(displayName)}</td>
                <td><code>${escapeText(expression)}</code></td>
                <td>${escapeText(sourceText)}</td>
                <td>${valueText}</td>
            </tr>
        `
    }).join('')

    return `
        <div class="material-price-section">
            <div class="quote-section-title">Formula runtime detail</div>
            <table class="quote-table quote-formula-table">
                <colgroup>
                    <col class="quote-formula-field-col">
                    <col class="quote-formula-expression-col">
                    <col class="quote-formula-source-col">
                    <col class="quote-formula-value-col">
                </colgroup>
                <thead>
                    <tr>
                        <th>Field</th>
                        <th>Expression</th>
                        <th>Source</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `
}

function persistHistory() {
    try {
        localStorage.setItem('chat_history', JSON.stringify(chatHistory))
    } catch (e) {
        Logger.error('Failed to save chat history', { error: e.message })
    }
}

function findHistoryItemByElement(element) {
    const messageEl = element.closest('.message')
    if (!messageEl) return null
    const messageId = messageEl.dataset.messageId
    return chatHistory.find(msg => msg.id === messageId) || null
}

function mergeUpdatedResult(previousResult, nextResult) {
    if (!nextResult) {
        return previousResult || null
    }

    const mergedResult = {
        ...(previousResult || {}),
        ...nextResult
    }
    if (previousResult?.calculation_detail || nextResult?.calculation_detail) {
        mergedResult.calculation_detail = {
            ...(previousResult?.calculation_detail || {}),
            ...(nextResult?.calculation_detail || {})
        }
    }

    if (previousResult?.formula_open !== undefined && nextResult.formula_open === undefined) {
        mergedResult.formula_open = previousResult.formula_open
    }
    delete mergedResult.hitl_pending
    delete mergedResult.hitl_confirmation
    if (hasRenderableCalculation(mergedResult)) {
        recalculateMaterialDrivenTotals(mergedResult)
    }
    return mergedResult
}

function rerenderHistoryMessage(historyItem) {
    if (!historyItem?.id) return
    const messageEl = chatMessages.querySelector(`.message[data-message-id="${historyItem.id}"]`)
    const contentEl = messageEl?.querySelector('.message-content')
    if (!contentEl) return
    contentEl.innerHTML = renderMessageContent(historyItem.role, historyItem.content, historyItem.result)
}

function findLatestCalculationHistoryItem(targetConversationId, excludeMessageId = null) {
    return [...chatHistory].reverse().find(msg =>
        msg?.role === 'assistant' &&
        msg?.id !== excludeMessageId &&
        hasRenderableCalculation(msg?.result) &&
        (msg.conversationId || conversationId) === targetConversationId
    ) || null
}

function removeMessageRecord(messageId) {
    if (!messageId) return
    const messageEl = chatMessages.querySelector(`.message[data-message-id="${messageId}"]`)
    if (messageEl) {
        messageEl.remove()
    }
    const index = chatHistory.findIndex(msg => msg.id === messageId)
    if (index >= 0) {
        chatHistory.splice(index, 1)
        persistHistory()
    }
}

function buildMaterialChangeMessage(part, material) {
    const partName = String(part?.name || part?.display_name || part?.source_name || '').trim()
    const displayNameMap = {
        cavity: 'Cavity Insert',
        core: 'Core Insert',
        fix_plate: 'Cavity Plate',
        move_plate: 'Core Plate',
        top_plate: 'Top Plate',
        hotrunner_plate: 'Hot Runner Plate',
        ejector_plate1: 'Ejector Plate 1',
        ejector_plate2: 'Ejector Plate 2',
        mold_foot: 'Mold Foot',
        bottom_plate: 'Bottom Plate'
    }
    const safePartName = displayNameMap[partName] || partName || 'Current part'
    return `${safePartName}: material changed to ${material}`
}

function handleFormulaToggleClick(event) {
    const toggle = event.target.closest('.formula-toggle')
    if (!toggle) return

    const report = toggle.closest('.quote-report')
    const panel = report?.querySelector('.formula-panel')
    if (!panel) return

    const isOpening = panel.classList.contains('hidden')
    panel.classList.toggle('hidden', !isOpening)
    toggle.classList.toggle('open', isOpening)
    const hint = toggle.querySelector('.quote-toggle-hint')
    if (hint) {
        hint.textContent = isOpening ? 'Collapse formulas' : 'Expand formulas'
    }

    const historyItem = findHistoryItemByElement(toggle)
    if (historyItem?.result) {
        historyItem.result = {
            ...historyItem.result,
            formula_open: isOpening
        }
        persistHistory()
    }
}

function handleFormulaParamClick(event) {
    const param = event.target.closest('.quote-param-item-formula')
    if (!param) return

    const report = param.closest('.quote-report')
    const panel = report?.querySelector('.formula-panel')
    const toggle = report?.querySelector('.formula-toggle')
    if (!panel) return

    panel.classList.remove('hidden')
    toggle?.classList.add('open')
    const hint = toggle?.querySelector('.quote-toggle-hint')
    if (hint) {
        hint.textContent = 'Collapse formulas'
    }

    const field = param.dataset.formulaField
    const row = field ? panel.querySelector(`[data-formula-row="${CSS.escape(field)}"]`) : null
    if (row) {
        panel.querySelectorAll('.formula-row-highlight').forEach(item => item.classList.remove('formula-row-highlight'))
        row.classList.add('formula-row-highlight')
        row.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }

    const historyItem = findHistoryItemByElement(param)
    if (historyItem?.result) {
        historyItem.result = {
            ...historyItem.result,
            formula_open: true
        }
        persistHistory()
    }
}

function closeAllMaterialDropdowns() {
    document.querySelectorAll('.material-select-menu.is-open').forEach((menu) => {
        setMaterialDropdownOpen(menu, false)
    })
}

function setMaterialDropdownOpen(menu, open) {
    if (!menu) return
    const trigger = menu.querySelector('.material-select')
    const dropdown = menu.querySelector('.material-dropdown')
    const wrap = menu.closest('.quote-table-wrap')
    menu.classList.toggle('is-open', open)
    dropdown?.classList.toggle('hidden', !open)
    trigger?.classList.toggle('is-open', open)
    trigger?.setAttribute('aria-expanded', open ? 'true' : 'false')
    if (wrap) {
        const stillOpen = wrap.querySelector('.material-select-menu.is-open')
        wrap.classList.toggle('is-dropdown-open', Boolean(stillOpen))
    }
}

function handleMaterialSelectClick(event) {
    const item = event.target.closest('.material-dropdown-item')
    if (item) {
        event.preventDefault()
        event.stopPropagation()
        const menu = item.closest('.material-select-menu')
        const select = menu?.querySelector('.material-select')
        if (!select || select.disabled) return
        applyMaterialSelection(select, item.dataset.value || '')
        return
    }

    const select = event.target.closest('.material-select')
    if (!select) return
    event.preventDefault()
    event.stopPropagation()
    if (select.disabled) return

    const menu = select.closest('.material-select-menu')
    const willOpen = !menu?.classList.contains('is-open')
    closeAllMaterialDropdowns()
    if (willOpen) {
        setMaterialDropdownOpen(menu, true)
    }
}

function applyMaterialSelection(select, material) {
    const historyItem = findHistoryItemByElement(select)
    const result = historyItem?.result
    const detail = result?.calculation_detail
    const parts = detail?.parts
    const materialRows = Array.isArray(detail?.material_detail) && detail.material_detail.length ? detail.material_detail : parts
    const partIndex = Number(select.dataset.partIndex)
    if (!result || !detail || !Array.isArray(parts) || !Array.isArray(materialRows) || !Number.isInteger(partIndex) || !materialRows[partIndex]) {
        return
    }

    const part = materialRows[partIndex]
    if (!material || material === part.material) {
        closeAllMaterialDropdowns()
        return
    }

    const message = buildMaterialChangeMessage(part, material)
    closeAllMaterialDropdowns()
    select.disabled = true
    select.classList.add('is-disabled')
    sendChatMessage(message).finally(() => {
        select.disabled = false
        select.classList.remove('is-disabled')
    })
}

function recalculateMaterialDrivenTotals(result) {
    const detail = result?.calculation_detail || {}
    const parts = Array.isArray(detail.parts) ? detail.parts : []
    const totalMaterial = parts.reduce((sum, part) => sum + Number(part.material_cost || 0), 0)
    const standardPartsRatio = Number(detail.standard_parts_ratio || 0)
    const isFixedStandardPartsCost = String(detail.standard_parts_cost_mode || '').trim().toLowerCase() === 'fixed'
    const syncFormulaTraceValue = (field, value) => {
        if (!detail.formula_traces || !detail.formula_traces[field]) {
            return
        }
        detail.formula_traces[field] = {
            ...detail.formula_traces[field],
            value
        }
    }

    if (!isFixedStandardPartsCost && Number.isFinite(standardPartsRatio) && standardPartsRatio > 0) {
        detail.standard_parts_cost = totalMaterial * standardPartsRatio
        syncFormulaTraceValue('standard_parts_cost', detail.standard_parts_cost)
    }

    const cavityPart = parts.find(part => part.name === 'Cavity Insert') || parts[0]
    const sliderRatio = Number(detail.slider_ratio || 0.8)
    if (detail.has_slider && cavityPart && Number.isFinite(sliderRatio)) {
        detail.slider_cost = Number(cavityPart.material_cost || 0) * sliderRatio
    } else if (!detail.has_slider) {
        detail.slider_cost = 0
    }
    syncFormulaTraceValue('slider_cost', detail.slider_cost)

    const surfaceRequirement = String(detail.surface_requirement || '').trim()
    const surfaceArea = Number(detail.surface_area_cm2 || 0)
    const polishingUnitPrice = Number(detail.polishing_unit_price || 0)
    const textureUnitPrice = Number(detail.texture_unit_price || 0)
    if (surfaceRequirement === 'high_gloss' && Number.isFinite(surfaceArea) && Number.isFinite(polishingUnitPrice)) {
        detail.polishing_cost = surfaceArea * polishingUnitPrice
        detail.texture_cost = 0
    } else if (surfaceRequirement === 'texture' && Number.isFinite(surfaceArea) && Number.isFinite(textureUnitPrice)) {
        detail.polishing_cost = 0
        detail.texture_cost = surfaceArea * textureUnitPrice
    } else if (surfaceRequirement && surfaceRequirement !== 'high_gloss' && surfaceRequirement !== 'texture') {
        detail.polishing_cost = 0
        detail.texture_cost = 0
    }
    syncFormulaTraceValue('polishing_cost', detail.polishing_cost)
    syncFormulaTraceValue('texture_cost', detail.texture_cost)

    const feeTotal = Number(detail.electrode_cost || 0)
        + Number(detail.slider_cost || 0)
        + Number(detail.hotrunner_cost || 0)
        + Number(detail.polishing_cost || 0)
        + Number(detail.texture_cost || 0)
        + Number(detail.oil_cylinder_cost || 0)
        + Number(detail.standard_parts_cost || 0)
        + Number(detail.other_cost || 0)
    const ratio = Number(detail.material_ratio || 0)
    const difficulty = Number(detail.difficulty_factor || 1)
    if (ratio > 0) {
        result.mold_price = Math.round((totalMaterial / ratio + feeTotal) * difficulty * 100) / 100
    }
}

async function handleHITLActionClick(event) {
    const confirmBtn = event.target.closest('.hitl-confirm-btn')
    const cancelBtn = event.target.closest('.hitl-cancel-btn')
    if (!confirmBtn && !cancelBtn) return

    const messageEl = event.target.closest('.message')
    const historyItem = messageEl ? findHistoryItemByElement(messageEl) : null
    const hitlBox = event.target.closest('.hitl-confirm-box, .hitl-box')
    const targetConversationId = historyItem?.conversationId || conversationId
    const hitlHistoryItem = historyItem?.result?.hitl_confirmation ? historyItem : [...chatHistory].reverse().find(msg =>
        msg?.result?.hitl_confirmation && (msg.conversationId || conversationId) === targetConversationId
    )
    if (!targetConversationId || !hitlBox) {
        return
    }

    const confirmed = Boolean(confirmBtn)
    const actionBtn = confirmBtn || cancelBtn
    const buttons = hitlBox.querySelectorAll('.hitl-btn')
    const statusEl = hitlBox.querySelector('.hitl-status')
    const oldStatus = statusEl?.textContent || ''
    buttons.forEach(btn => { btn.disabled = true })
    actionBtn.disabled = true
    if (statusEl) {
        statusEl.textContent = confirmed ? 'Confirming...' : 'Cancelling...'
    }

    try {
        const response = await api.hitlConfirm(targetConversationId, confirmed)
        if (hitlHistoryItem) {
            hitlHistoryItem.result = mergeUpdatedResult(hitlHistoryItem.result, response.result)
            if (hitlHistoryItem.result) {
                rerenderHistoryMessage(hitlHistoryItem)
            }
            persistHistory()
        }
        hitlBox.dataset.hitlStatus = confirmed ? 'confirmed' : 'cancelled'
        if (statusEl) {
            statusEl.textContent = confirmed ? 'Changed' : 'Unchanged'
        }
        lastHITLResult = null
        addMessage('assistant', response.message)
    } catch (error) {
        buttons.forEach(btn => { btn.disabled = false })
        if (statusEl) {
            statusEl.textContent = oldStatus || 'Operation failed'
        }
        Logger.error('HITL confirmation failed', { error: error.message })
    }
}

// ============ Voice input ============
function handleVoiceInput() {
    Logger.info('Click the voice input button')

    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        Logger.warn('Browser does not support speech recognition')
        alert('Sorry, your browser does not support speech recognition. Please use Chrome or Edge.')
        return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
        Logger.info('Start speech recognition')
        voiceBtn.classList.add('recording')
        voiceBtn.title = 'Listening...'
    }

    recognition.onresult = (event) => {
        const text = event.results[0][0].transcript
        Logger.info('Speech recognition result', { text })
        chatInput.value = text
    }

    recognition.onerror = (event) => {
        Logger.error(`Speech recognition error: ${event.error}`)
        if (event.error === 'not-allowed') {
            alert('Please allow microphone permission to use voice input.')
        }
    }

    recognition.onend = () => {
        voiceBtn.classList.remove('recording')
        voiceBtn.title = 'Voice input'
    }

    try {
        recognition.start()
    } catch (error) {
        Logger.error(`Failed to start speech recognition: ${error.message}`)
    }
}

// ============ File management ============
function openFilePanel() {
    filePanel.classList.remove('hidden')
    fileBtn?.classList.add('is-active')
    fileBtn?.setAttribute('aria-expanded', 'true')
    document.body.style.overflow = 'hidden'
    updateKBUploadPermissions()
    switchToKBTab()
}

function updateKBUploadPermissions() {
    if (!fileUploadArea || !selectFileBtn || !fileInput) return
    const title = fileUploadArea.querySelector('p:not(.file-tip)')
    const tip = fileUploadArea.querySelector('.file-tip')
    const canUpload = isAdminUser()
    fileUploadArea.classList.toggle('kb-upload-readonly', !canUpload)
    selectFileBtn.disabled = !canUpload
    fileInput.disabled = !canUpload
    if (canUpload) {
        if (title) title.textContent = 'Click to select one or more PDFs, or drag and drop here'
        if (tip) tip.textContent = `Batch PDFs supported; max 50MB per file; up to ${MAX_KB_BATCH_FILES} at a time`
        selectFileBtn.textContent = 'Batch upload PDF'
    } else {
        if (title) title.textContent = 'This account can view and correct knowledge content'
        if (tip) tip.textContent = 'New PDF uploads and document deletion are handled by admins'
        selectFileBtn.textContent = 'Admin upload only'
    }
}

function closeFilePanelHandler() {
    filePanel.classList.add('hidden')
    fileBtn?.classList.remove('is-active')
    fileBtn?.setAttribute('aria-expanded', 'false')
    document.body.style.overflow = ''
}

async function loadFileList() {
    try {
        const data = await api.listKnowledgeFiles(50)
        renderFileList(data.files || [])
    } catch (error) {
        Logger.error(`Failed to load file list: ${error.message}`)
        fileList.innerHTML = '<div class="file-list-empty">Load failed</div>'
    }
}

function renderFileList(files) {
    if (!files || files.length === 0) {
        fileList.innerHTML = '<div class="file-list-empty">No uploaded files</div>'
        return
    }

    fileList.innerHTML = files.map(file => `
        <div class="file-item" data-file-id="${file.id}">
            <div class="file-icon">${getFileIcon(file.file_type)}</div>
            <div class="file-info">
                <div class="file-name" title="${escapeHtml(file.original_filename)}">${escapeHtml(file.original_filename)}</div>
                <div class="file-meta">
                    ${formatFileSize(file.file_size)} · ${formatDate(file.created_at)}
                    ${file.status === 'completed' ? '· Imported' : file.status === 'processing' ? '· Processing' : '· Failed'}
                </div>
            </div>
            <div class="file-actions">
                <button class="file-delete-btn" onclick="deleteFile('${file.id}')">Delete</button>
            </div>
        </div>
    `).join('')
}

function getFileIcon(fileType) {
    const icons = {
        'pdf': 'PDF',
        'xlsx': 'XLS',
        'xls': 'XLS',
        'docx': 'DOC',
        'doc': 'DOC'
    }
    return icons[fileType] || 'FILE'
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US')
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files || [])
    if (files.length) {
        uploadFiles(files)
    }
    e.target.value = ''
}

function handleFileDrop(e) {
    e.preventDefault()
    fileUploadArea.classList.remove('drag-active')

    const files = Array.from(e.dataTransfer.files || [])
    if (files.length) {
        uploadFiles(files)
    }
}

async function uploadFile(file) {
    return uploadFiles([file])
}

async function uploadFiles(files) {
    if (!isAdminUser()) {
        alert('New PDF uploads are handled by admins; regular users can correct answers or edit existing knowledge at cited sources.')
        return
    }

    const selected = Array.from(files || [])
    if (!selected.length) return
    if (selected.length > MAX_KB_BATCH_FILES) {
        alert(`Upload at most ${MAX_KB_BATCH_FILES} PDFs at a time; please batch them.`)
        return
    }

    const invalid = []
    const accepted = []
    selected.forEach(file => {
        const ext = '.' + String(file.name || '').split('.').pop().toLowerCase()
        if (ext !== '.pdf') {
            invalid.push(`${file.name}: PDF only`)
            return
        }
        if (file.size > 50 * 1024 * 1024) {
            invalid.push(`${file.name}: exceeds 50MB`)
            return
        }
        accepted.push(file)
    })

    if (invalid.length) {
        alert('The following files cannot be uploaded:\n' + invalid.join('\n'))
    }
    if (!accepted.length) return

    return parseToKB(accepted)
}

// ========== Compat path: legacy knowledge file upload API (no longer exposed in UI)============
async function uploadToKnowledgeBase(file) {
    // Show progress
    uploadProgress.classList.remove('hidden')
    progressFilename.textContent = file.name
    progressStatus.textContent = 'Uploading...'
    progressFill.style.width = '0%'
    progressImported.textContent = '0'
    progressTotal.textContent = '...'
    selectFileBtn.disabled = true

    try {
        const result = await api.uploadKnowledgeFile(file, (status) => {
            if (status.status === 'processing') {
                progressStatus.textContent = 'Processing'
                progressFill.style.width = Math.round((status.imported / status.total) * 100) + '%'
                progressImported.textContent = status.imported
                progressTotal.textContent = status.total
            } else if (status.status === 'completed') {
                progressStatus.textContent = 'Completed'
                progressFill.style.width = '100%'
                progressImported.textContent = status.imported
                progressTotal.textContent = status.total
            } else if (status.status === 'failed') {
                progressStatus.textContent = 'Failed: ' + (status.error || 'Unknown error')
            }
        })

        Logger.info('File uploaded successfully', { fileId: result.file_id })
        progressStatus.textContent = 'Import complete'
        setTimeout(() => {
            uploadProgress.classList.add('hidden')
            selectFileBtn.disabled = false
            loadFileList()
        }, 1500)
    } catch (error) {
        Logger.error(`File upload failed: ${error.message}`)
        progressStatus.textContent = 'Failed: ' + error.message
        selectFileBtn.disabled = false
    }
}

// ========== New path: parse into KB Knowledge Base ============
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function stageStatusLabel(task) {
    if (!task) return 'Waiting'
    if (task.status === 'completed') return 'Completed'
    if (task.status === 'failed') return 'Failed'
    return task.stage_label || 'Processing'
}

function renderKBUploadProgress(batchStatus) {
    const tasks = batchStatus?.tasks || []
    const total = Number(batchStatus?.total || tasks.length || 0)
    const completed = Number(batchStatus?.completed || 0)
    const failed = Number(batchStatus?.failed || 0)
    const progress = Math.max(0, Math.min(100, Number(batchStatus?.progress || 0)))
    const runningTask = tasks.find(task => task.status === 'processing') || tasks.find(task => task.status === 'queued') || tasks[0]
    const batchDone = batchStatus?.batch_status === 'completed' || batchStatus?.batch_status === 'completed_with_errors'

    uploadProgress.classList.remove('hidden')
    progressFilename.textContent = total > 1 ? `Batch ingest ${total} PDFs` : (runningTask?.filename || 'KB document ingest')
    if (batchDone) {
        progressStatus.textContent = failed ? `Done ${completed}/${total}, failed ${failed}` : `All done ${completed}/${total}`
    } else {
        progressStatus.textContent = `${stageStatusLabel(runningTask)} · ${completed}/${total} Completed`
    }
    progressFill.style.width = `${progress}%`
    progressImported.textContent = completed
    progressTotal.textContent = total || '...'

    if (progressFileList) {
        progressFileList.innerHTML = tasks.map(task => {
            const taskProgress = Math.max(0, Math.min(100, Number(task.progress || 0)))
            const statusClass = task.status === 'completed' ? 'completed' : task.status === 'failed' ? 'failed' : 'processing'
            const stats = task.stats || {}
            const detail = task.status === 'completed'
                ? `Merged chunk ${task.merged_chunks || stats.merged_chunks || 0} · cleaned ${task.cleaned_chunks || stats.cleaned_chunks || 0}`
                : task.status === 'failed'
                    ? (task.error || 'Processing failed')
                    : stageStatusLabel(task)
            return `
                <div class="progress-file-row ${statusClass}">
                    <div class="progress-file-main">
                        <span class="progress-file-name" title="${escapeAttr(task.filename || '')}">${escapeText(task.filename || 'PDF')}</span>
                        <span class="progress-file-status">${escapeText(stageStatusLabel(task))}</span>
                    </div>
                    <div class="progress-file-bar"><div style="width:${taskProgress}%"></div></div>
                    <div class="progress-file-detail">${escapeText(detail)}</div>
                </div>`
        }).join('')
    }
}

async function parseToKB(filesOrFile) {
    const files = Array.isArray(filesOrFile) ? filesOrFile : [filesOrFile]
    if (!files.length) return

    uploadProgress.classList.remove('hidden')
    progressFilename.textContent = files.length > 1 ? `Batch ingest ${files.length} PDFs` : files[0].name
    progressStatus.textContent = 'Creating upload queue...'
    progressFill.style.width = '0%'
    progressImported.textContent = '0'
    progressTotal.textContent = files.length
    if (progressFileList) {
        progressFileList.innerHTML = files.map(file => `
            <div class="progress-file-row processing">
                <div class="progress-file-main">
                    <span class="progress-file-name" title="${escapeAttr(file.name)}">${escapeText(file.name)}</span>
                    <span class="progress-file-status">Waiting to upload</span>
                </div>
                <div class="progress-file-bar"><div style="width:0%"></div></div>
                <div class="progress-file-detail">Waiting for backend</div>
            </div>`).join('')
    }
    selectFileBtn.disabled = true

    let latestStatus = null
    try {
        latestStatus = await api.parseDocumentsToKB(files, getSelectedMoldCategory())
        Logger.info('KB batch parse job created', latestStatus)
        renderKBUploadProgress(latestStatus)

        while (!['completed', 'completed_with_errors'].includes(latestStatus.batch_status)) {
            await wait(1200)
            latestStatus = await api.getKBParseBatchStatus(latestStatus.batch_id)
            renderKBUploadProgress(latestStatus)
        }

        renderKBUploadProgress(latestStatus)
        const tasks = latestStatus.tasks || []
        const completed = Number(latestStatus.completed || 0)
        const failed = Number(latestStatus.failed || 0)
        const mergedTotal = tasks.reduce((sum, task) => sum + Number(task.merged_chunks || task.stats?.merged_chunks || 0), 0)
        progressStatus.textContent = failed ? `Batch ingest complete, failed ${failed}` : `Batch ingest complete: ${mergedTotal} merged chunks`
        progressFill.style.width = '100%'

        setTimeout(() => {
            selectFileBtn.disabled = false
            if (!failed) {
                uploadProgress.classList.add('hidden')
            }
            alert(
                `KB batch ingest complete\n\n` +
                `Files: ${files.length}\n` +
                `Succeeded: ${completed}\n` +
                `Failed: ${failed}\n` +
                `Merged chunk: ${mergedTotal}\n\n` +
                `Preserved source_chunk_ids and page provenance.`
            )
            switchToKBTab()
        }, failed ? 500 : 1500)
    } catch (error) {
        Logger.error(`KB batch parse failed: ${error.message}`)
        progressStatus.textContent = 'Failed: ' + error.message
        if (progressFileList && !latestStatus) {
            progressFileList.innerHTML = `<div class="progress-file-row failed"><div class="progress-file-detail">${escapeText(error.message)}</div></div>`
        }
        selectFileBtn.disabled = false
    }
}

// ========== KB list render ============
let currentKBTab = 'docs'  // 'docs' | 'search'

async function loadKBDocumentList() {
    try {
        const result = await api.listKBDocuments()
        renderKBDocList(result.documents || [])
    } catch (error) {
        Logger.error(`Failed to load KB list: ${error.message}`)
    }
}

function compactId(id, head = 10, tail = 6) {
    const value = String(id || '')
    if (value.length <= head + tail + 3) return value
    return `${value.slice(0, head)}...${value.slice(-tail)}`
}

function renderStructuredRecords(chunk) {
    const table = chunk?.structured_table || {}
    const records = Array.isArray(table.records) ? table.records : []
    if (!records.length) return ''

    const rowsHtml = records.map((record, index) => {
        const dimensions = Array.isArray(record.dimensions)
            ? record.dimensions.filter(Boolean).join(' / ')
            : ''
        const value = record.value || ''
        const recordType = record.record_type || 'record'
        const rowIndex = record.row_index || '-'
        const colIndex = record.col_index || '-'
        const recordText = record.record_text || (dimensions && value ? `${dimensions} => ${value}` : '')
        const jsonText = JSON.stringify(record, null, 2)
        return `
          <div class="kb-record-row">
            <div class="kb-record-main">
              <span class="kb-record-index">#${index + 1}</span>
              <span class="kb-record-condition">${escapeText(recordText || dimensions || value)}</span>
            </div>
            <div class="kb-record-meta-line">${escapeText(recordType)} · row ${escapeText(rowIndex)} · col ${escapeText(colIndex)}</div>
            <details class="kb-record-json-detail">
              <summary>JSON</summary>
              <pre class="kb-record-json">${escapeText(jsonText)}</pre>
            </details>
          </div>`
    }).join('')

    return `
      <details class="kb-records-detail">
        <summary>View structured records (${records.length})</summary>
        <div class="kb-records-list">${rowsHtml}</div>
      </details>`
}

function renderKBDocList(docs) {
    const kbList = document.getElementById('kb-list')
    if (!kbList) return
    if (docs.length === 0) {
        kbList.innerHTML = '<div class="file-list-empty">No parsed documents yet<br>Uploaded PDFs are added to the KB Knowledge Base automatically</div>'
        return
    }
    let html = '<div class="kb-doc-list">'
    const canDeleteKB = currentUser?.role === 'admin'
    docs.forEach(doc => {
        const ts = doc.last_retrieved_at || doc.created_at || '?'
        const filename = doc.filename || doc.doc_id || 'Untitled document'
        const displayName = filename.length > 30 ? `${filename.slice(0, 30)}...` : filename
        html += `
        <div class="kb-doc-item" data-doc-id="${escapeAttr(doc.doc_id)}">
          <div class="kb-doc-icon">PDF</div>
          <div class="kb-doc-info">
            <div class="kb-doc-name" title="${escapeAttr(filename)}">${escapeText(displayName)}</div>
            <div class="kb-doc-meta">${doc.chunk_count || doc.total_merged_chunks || 0}Merged chunk · raw ${doc.raw_chunk_count || doc.total_chunks || 0} · ${escapeText(ts)}</div>
          </div>
          ${canDeleteKB ? `<button class="file-delete-btn kb-delete-doc-btn" data-doc-id="${escapeAttr(doc.doc_id)}" data-doc-name="${escapeAttr(filename || doc.doc_id)}">Delete</button>` : ''}
        </div>`
    })
    html += '</div>'
    kbList.innerHTML = html
    kbList.querySelectorAll('.kb-delete-doc-btn').forEach(btn => {
        btn.addEventListener('click', async (event) => {
            event.stopPropagation()
            const docId = btn.dataset.docId
            const docName = btn.dataset.docName || docId
            if (!confirm(`Delete this KB document?\n\n${docName}\n\nThis also clears merged chunks, raw chunks, answer corrections, knowledge patches, and the TextIn parse directory.`)) {
                return
            }
            try {
                btn.disabled = true
                btn.textContent = 'Deleting...'
                await api.deleteKBDocument(docId)
                Logger.info(`KB document deleted: ${docId}`)
                loadKBDocumentList()
            } catch (error) {
                Logger.error(`Failed to delete KB document: ${error.message}`)
                alert('Failed to delete KB document: ' + error.message)
                btn.disabled = false
                btn.textContent = 'Delete'
            }
        })
    })
    // Bind clicks
    kbList.querySelectorAll('.kb-doc-item').forEach(el => {
        el.addEventListener('click', () => {
            const docId = el.dataset.docId
            showKBDocumentDetail(docId)
        })
    })
}

async function showKBDocumentDetail(docId) {
    try {
        const doc = await api.getKBDocument(docId)
        const kbList = document.getElementById('kb-list')
        if (!kbList) return
        const meta = doc.doc_meta || {}
        const chunks = doc.chunks || []
        const title = meta.filename || docId
        let html = `
        <div class="kb-doc-detail">
          <button class="back-btn" id="kb-back-btn">← Back to list</button>
          <h3>${escapeText(title)}</h3>
          <div class="kb-doc-stats">${chunks.length} merged chunks · keeps source_chunk_ids and page ranges</div>
          <div class="kb-chunks">`
        if (chunks.length === 0) {
            html += '<div class="file-list-empty">No source chunks to display</div>'
        }
        chunks.forEach((chunk, index) => {
            const chunkId = chunk.chunk_id || ''
            const pageStart = chunk.page_start || chunk.page_id || '?'
            const pageEnd = chunk.page_end || pageStart
            const page = String(pageStart) !== String(pageEnd) ? `${pageStart}-${pageEnd}` : pageStart
            const type = chunk.sub_type || 'text'
            const contentType = chunk.content_type || ''
            const isTable = contentType === 'table' || String(type).toLowerCase().includes('table')
            const typeLabel = isTable ? 'table' : type
            const section = chunk.section || ''
            const rawText = chunk.text || ''
            const textLength = chunk.text_length || rawText.length || 0
            const sourceIds = chunk.source_chunk_ids || []
            const sourceCount = chunk.source_chunk_count || sourceIds.length || 1
            const partIndex = Number(chunk.source_part_index || 0)
            const partCount = Number(chunk.source_part_count || 0)
            const structuredRecordCount = Number(chunk.structured_record_count || 0)
            const partText = partCount > 1 && partIndex ? ` ${partIndex}/${partCount}` : ''
            const itemClass = isTable ? 'kb-chunk-item kb-chunk-table' : 'kb-chunk-item'
            const recordsHtml = isTable ? renderStructuredRecords(chunk) : ''
            const bodyHtml = isTable
                ? `<details class="kb-table-detail" ${textLength <= 900 ? 'open' : ''}>
                    <summary>Table chunk${escapeText(partText)}</summary>
                    <div class="kb-chunk-text kb-table-text">${escapeText(rawText)}</div>
                  </details>${recordsHtml}`
                : `<div class="kb-chunk-text">${escapeText(rawText)}</div>`
            html += `
            <div class="${itemClass}" data-chunk-id="${escapeAttr(chunkId)}">
              <div class="kb-chunk-header">
                <span class="kb-section">${isTable ? 'Table chunk' : 'Merged chunk'} ${index + 1}${escapeText(partText)}</span>
                <span class="kb-ctype">p.${escapeText(page)}</span>
                <span class="kb-ctype">${escapeText(typeLabel)}</span>
                ${section ? `<span class="kb-ctype" title="${escapeAttr(section)}">${escapeText(compactId(section, 18, 8))}</span>` : ''}
              </div>
              ${bodyHtml}
              <div class="kb-chunk-meta">
                <span title="${escapeAttr(chunkId)}">chunk_id: ${escapeText(compactId(chunkId))}</span>
                <span>·</span>
                <span>${sourceCount}raw chunk</span>
                <span>·</span>
                <span>${textLength} chars</span>
                ${structuredRecordCount ? `<span>${structuredRecordCount} JSON records</span>` : ''}
                ${sourceIds.length ? `<span title="${escapeAttr(sourceIds.join(', '))}">source ids</span>` : ''}
              </div>
            </div>`
        })
        html += '</div>'
        html += '</div>'
        kbList.innerHTML = html
        document.getElementById('kb-back-btn').addEventListener('click', loadKBDocumentList)
    } catch (error) {
        Logger.error(`Failed to load KB details: ${error.message}`)
    }
}

// ========== Tab switch ============
function switchToKBTab() {
    // Hide legacy file tab; show KB tab
    const fileList = document.getElementById('file-list')
    const kbList = document.getElementById('kb-list')
    const tabDocs = document.getElementById('tab-docs')
    const tabKb = document.getElementById('tab-kb')

    if (fileList) fileList.classList.add('hidden')
    if (kbList) {
        kbList.classList.remove('hidden')
        loadKBDocumentList()
    }
    if (tabDocs) tabDocs.classList.remove('active')
    if (tabKb) tabKb.classList.add('active')
}

function switchToDocsTab() {
    const fileList = document.getElementById('file-list')
    const kbList = document.getElementById('kb-list')
    const tabDocs = document.getElementById('tab-docs')
    const tabKb = document.getElementById('tab-kb')

    if (fileList) fileList.classList.remove('hidden')
    if (kbList) kbList.classList.add('hidden')
    if (tabDocs) tabDocs.classList.add('active')
    if (tabKb) tabKb.classList.remove('active')
}

async function deleteFile(fileId) {
    if (!confirm('Delete this file? This cannot be undone.')) {
        return
    }

    try {
        await api.deleteKnowledgeFile(fileId)
        Logger.info('File deleted successfully', { fileId })
        loadFileList()
    } catch (error) {
        Logger.error(`Failed to delete file: ${error.message}`)
        alert('DeleteFailed: ' + error.message)
    }
}

// ============ Boot application ============
document.addEventListener('DOMContentLoaded', init)
