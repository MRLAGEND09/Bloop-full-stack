export const PERSISTED_STATE_KEY = 'bloop_state_v1'
export const PERSISTED_STATE_VERSION = 1

const LEGACY_KEYS = {
  token: 'token',
  cart: 'bloop-cart',
  user: 'bloop-user',
  filters: 'bloop-filters',
  chat: 'bloop-chat'
}

const defaultCollectionFilters = {
  showFilter: false,
  category: [],
  subCategory: [],
  selectedCollection: '',
  selectedBrands: [],
  selectedSizes: [],
  selectedColors: [],
  priceMin: '',
  priceMax: '',
  minRating: '',
  sortType: 'relevant'
}

const defaultState = {
  token: '',
  cartItems: {},
  userInfo: null,
  wishlist: [],
  recentlyViewed: [],
  filters: {
    search: '',
    showSearch: false,
    collection: defaultCollectionFilters
  },
  chat: {
    messages: [],
    isLocked: false,
    lockText: '',
    ticketId: ''
  }
}

const isBrowser = typeof window !== 'undefined'

const safeParse = (value, fallback) => {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch (error) {
    return fallback
  }
}

const normalizeCollectionFilters = (value = {}) => ({
  showFilter: Boolean(value?.showFilter),
  category: Array.isArray(value?.category) ? value.category : [],
  subCategory: Array.isArray(value?.subCategory) ? value.subCategory : [],
  selectedCollection: value?.selectedCollection || '',
  selectedBrands: Array.isArray(value?.selectedBrands) ? value.selectedBrands : [],
  selectedSizes: Array.isArray(value?.selectedSizes) ? value.selectedSizes : [],
  selectedColors: Array.isArray(value?.selectedColors) ? value.selectedColors : [],
  priceMin: value?.priceMin || '',
  priceMax: value?.priceMax || '',
  minRating: value?.minRating || '',
  sortType: value?.sortType || 'relevant'
})

const normalizeState = (value = {}) => ({
  token: typeof value?.token === 'string' ? value.token : '',
  cartItems: value?.cartItems && typeof value.cartItems === 'object' ? value.cartItems : {},
  userInfo: value?.userInfo && typeof value.userInfo === 'object' ? value.userInfo : null,
  wishlist: Array.isArray(value?.wishlist) ? value.wishlist : [],
  recentlyViewed: Array.isArray(value?.recentlyViewed) ? value.recentlyViewed : [],
  filters: {
    search: typeof value?.filters?.search === 'string' ? value.filters.search : '',
    showSearch: Boolean(value?.filters?.showSearch),
    collection: normalizeCollectionFilters(value?.filters?.collection)
  },
  chat: {
    messages: Array.isArray(value?.chat?.messages) ? value.chat.messages : [],
    isLocked: Boolean(value?.chat?.isLocked),
    lockText: value?.chat?.lockText || '',
    ticketId: value?.chat?.ticketId || ''
  }
})

const readLegacyState = () => {
  if (!isBrowser) return null

  const token = window.localStorage.getItem(LEGACY_KEYS.token) || ''
  const cartItems = safeParse(window.localStorage.getItem(LEGACY_KEYS.cart), {})
  const userInfo = safeParse(window.localStorage.getItem(LEGACY_KEYS.user), null)
  const filters = safeParse(window.localStorage.getItem(LEGACY_KEYS.filters), {})
  const chat = safeParse(window.localStorage.getItem(LEGACY_KEYS.chat), null)

  const hasLegacyState = Boolean(
    token ||
    Object.keys(cartItems || {}).length ||
    userInfo ||
    Object.keys(filters || {}).length ||
    chat
  )

  if (!hasLegacyState) return null

  return normalizeState({
    token,
    cartItems,
    userInfo,
    filters: {
      search: filters?.search || '',
      showSearch: Boolean(filters?.showSearch),
      collection: filters?.collection || {}
    },
    chat: {
      messages: Array.isArray(chat?.messages) ? chat.messages : [],
      isLocked: Boolean(chat?.isLocked),
      lockText: chat?.lockText || '',
      ticketId: chat?.ticketId || ''
    }
  })
}

const clearLegacyKeys = () => {
  if (!isBrowser) return
  Object.values(LEGACY_KEYS).forEach((key) => window.localStorage.removeItem(key))
}

const readPersistedDataFromStorage = () => {
  if (!isBrowser) return defaultState

  const persisted = safeParse(window.localStorage.getItem(PERSISTED_STATE_KEY), null)
  if (persisted?.version === PERSISTED_STATE_VERSION && persisted?.data) {
    return normalizeState(persisted.data)
  }

  return defaultState
}

export const readPersistedState = () => {
  if (!isBrowser) return defaultState

  const persisted = safeParse(window.localStorage.getItem(PERSISTED_STATE_KEY), null)

  if (persisted?.version === PERSISTED_STATE_VERSION && persisted?.data) {
    return normalizeState(persisted.data)
  }

  const migratedState = readLegacyState()
  if (migratedState) {
    writePersistedState(migratedState)
    clearLegacyKeys()
    return migratedState
  }

  if (persisted && persisted.version !== PERSISTED_STATE_VERSION) {
    window.localStorage.removeItem(PERSISTED_STATE_KEY)
  }

  return defaultState
}

export const writePersistedState = (nextState = {}) => {
  if (!isBrowser) return
  const normalizedState = normalizeState({ ...readPersistedDataFromStorage(), ...nextState })
  window.localStorage.setItem(PERSISTED_STATE_KEY, JSON.stringify({
    version: PERSISTED_STATE_VERSION,
    data: normalizedState
  }))
}

export const clearPersistedState = () => {
  if (!isBrowser) return
  window.localStorage.removeItem(PERSISTED_STATE_KEY)
  clearLegacyKeys()
}

export const readPersistedToken = () => readPersistedState().token
export const persistToken = (token) => writePersistedState({ token })

export const readPersistedCartItems = () => readPersistedState().cartItems
export const persistCartItems = (cartItems) => writePersistedState({ cartItems })

export const readPersistedUserInfo = () => readPersistedState().userInfo
export const persistUserInfo = (userInfo) => writePersistedState({ userInfo })

export const readPersistedWishlist = () => readPersistedState().wishlist
export const persistWishlist = (wishlist) => writePersistedState({ wishlist })

export const readPersistedRecentlyViewed = () => readPersistedState().recentlyViewed
export const persistRecentlyViewed = (recentlyViewed) => writePersistedState({ recentlyViewed })

export const readPersistedSearchFilters = () => readPersistedState().filters

export const persistSearchFilters = (filtersPatch = {}) => {
  const state = readPersistedState()
  writePersistedState({
    filters: {
      ...state.filters,
      ...filtersPatch,
      collection: normalizeCollectionFilters(state.filters.collection)
    }
  })
}

export const readPersistedCollectionFilters = () => readPersistedState().filters.collection

export const persistCollectionFilters = (collectionFilters = {}) => {
  const state = readPersistedState()
  writePersistedState({
    filters: {
      ...state.filters,
      collection: normalizeCollectionFilters({
        ...state.filters.collection,
        ...collectionFilters
      })
    }
  })
}

export const readPersistedChat = (fallbackMessages = []) => {
  const chat = readPersistedState().chat
  return {
    messages: chat.messages.length ? chat.messages : fallbackMessages,
    isLocked: chat.isLocked,
    lockText: chat.lockText,
    ticketId: chat.ticketId
  }
}

export const persistChat = (chatPatch = {}) => {
  const state = readPersistedState()
  writePersistedState({
    chat: {
      ...state.chat,
      ...chatPatch
    }
  })
}