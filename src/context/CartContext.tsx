import React, {
  createContext, useContext, useEffect, useReducer, useCallback, useRef, ReactNode
} from 'react'
import type { CartItem, Product } from '../types'
import { getProductFinalPrice } from '../utils'
import { cartApi } from '../api'
import { useAuth } from './AuthContext'

const CART_KEY = 'lacquavi_cart'
const MAX_QUANTITY = 99

const sanitizeQuantity = (q: number): number =>
  Math.max(1, Math.min(MAX_QUANTITY, Math.floor(Number(q) || 1)))

interface CartState {
  items: CartItem[]
}

type CartAction =
  | { type: 'ADD_ITEM'; product: Product; quantity: number }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QTY'; productId: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; items: CartItem[] }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return { items: action.items }

    case 'ADD_ITEM': {
      const safeQty = sanitizeQuantity(action.quantity)
      const existing = state.items.find(i => i.productId === action.product.id)
      if (existing) {
        return {
          items: state.items.map(i =>
            i.productId === action.product.id
              ? { ...i, quantity: Math.min(MAX_QUANTITY, i.quantity + safeQty) }
              : i
          )
        }
      }
      return {
        items: [
          ...state.items,
          { productId: action.product.id, product: action.product, quantity: safeQty }
        ]
      }
    }

    case 'REMOVE_ITEM':
      return { items: state.items.filter(i => i.productId !== action.productId) }

    case 'UPDATE_QTY': {
      const safeQty = Number(action.quantity)
      if (!Number.isFinite(safeQty)) return state
      const clampedQty = Math.max(1, Math.min(MAX_QUANTITY, Math.floor(safeQty)))
      return {
        items: state.items.map(i =>
          i.productId === action.productId ? { ...i, quantity: clampedQty } : i
        )
      }
    }

    case 'CLEAR':
      return { items: [] }

    default:
      return state
  }
}

function getInitialCartState(): CartState {
  try {
    const saved = localStorage.getItem(CART_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as CartItem[]
      if (Array.isArray(parsed)) {
        return { items: parsed }
      }
    }
  } catch { /* ignore corrupt data */ }
  return { items: [] }
}

interface CartContextValue {
  items: CartItem[]
  totalItems: number
  subtotal: number
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  hasItem: (productId: string) => boolean
  getQuantity: (productId: string) => number
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, getInitialCartState())
  const { isAuthenticated } = useAuth()

  const [isCartOpen, setIsCartOpen] = React.useState(false)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Persist to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(state.items))
  }, [state.items])

  // Sync cart to backend (debounced 2s) for abandonment email tracking
  useEffect(() => {
    if (!isAuthenticated) return
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      cartApi.sync(state.items).catch(() => {})
    }, 2000)
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    }
  }, [state.items, isAuthenticated])

  const openCart = useCallback(() => setIsCartOpen(true), [])
  const closeCart = useCallback(() => setIsCartOpen(false), [])

  const addItem = useCallback((product: Product, quantity = 1) => {
    dispatch({ type: 'ADD_ITEM', product, quantity })
    setIsCartOpen(true) // Automatically open side-cart on add
  }, [])

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', productId })
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QTY', productId, quantity })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' })
    if (isAuthenticated) {
      cartApi.clear().catch(() => {})
    }
  }, [isAuthenticated])

  const hasItem = useCallback(
    (productId: string) => state.items.some(i => i.productId === productId),
    [state.items]
  )

  const getQuantity = useCallback(
    (productId: string) => state.items.find(i => i.productId === productId)?.quantity ?? 0,
    [state.items]
  )

  const totalItems = state.items.reduce((s, i) => s + i.quantity, 0)
  const subtotal = state.items.reduce((s, i) => s + getProductFinalPrice(i.product) * i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items: state.items,
      totalItems,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      hasItem,
      getQuantity,
      isCartOpen,
      openCart,
      closeCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
