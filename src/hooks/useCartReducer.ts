import { useReducer, useEffect, useState } from 'react'
import type { Item } from './useItems'
import { getCart, addCartItem } from '../api/api'

export interface CartItem {
  item: Item
  quantity: number
}

type Action =
  | { type: 'ADD'; item: Item, existing: boolean, newQuantity: number }
  | { type: 'CLEAR' }
  | { type: 'INIT'; cartItems: CartItem[] }

const cartReducer = (state: CartItem[], action: Action): CartItem[] => {
  switch (action.type) {
    // Lecture: Create case for adding item in cart
    case 'INIT':
      return action.cartItems
    case 'ADD':
      if(action.existing){
        return state.map(ci => ci.item.id === action.item.id ? {...ci, quantity: action.newQuantity} : ci)
      }
      return [...state, { item: action.item, quantity: action.newQuantity}]
    case 'CLEAR':
      return []
    default:
      return state
  }
}

export const useCart = (items: Item[]) => {
  const [cartItems, dispatch] = useReducer(cartReducer, [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Lecture: Get Cart
    if(items.length === 0) return 
    const fetch = async () => {
      try {
        setLoading(true)
        const data = await getCart()
        const parsedData: CartItem[] = data.map((entry: {item_id: number, quantity: number}) => {
          const item = items.find(i => i.id === entry.item_id)
          if (!item) return null
          if(item){
            return {item, quantity: entry.quantity}
          }
        }).filter(Boolean)
        console.log(parsedData)
        dispatch({type: 'INIT', cartItems: parsedData})
      } catch (error: any) {
        setError(error.response.data.message || 'Blyat')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [items])

  // Lecture: Add Item to Cart
  const addToCart = async (item: Item) => {
    const existing = cartItems.find(ci => ci.item.id === item.id)
    const newQuantity = existing ? existing.quantity + 1 : 1

    try {
      setLoading(true)
      await addCartItem(item.id, newQuantity)
      dispatch({type: 'ADD', item, existing: !!existing, newQuantity})
    } catch (error: any) {
      setError('Add to cart failed')
    } finally {
      setLoading(false)
    }
  }

  // Lecture: Clear Cart
  const clearCart = () => dispatch({type: 'CLEAR'})

  // Lecture: Calculate Total Items and Price
  const totalItems = 0
  const totalPrice = cartItems.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0)

  return { cartItems, addToCart, clearCart, totalItems, totalPrice, loading, error }
}
