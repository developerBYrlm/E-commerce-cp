import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "localsphere-cart";

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved)
      ? saved.filter((line) => line.product?._id && Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= 100)
      : [];
  } catch (error) {
    console.error("Unable to restore the saved cart:", error);
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Unable to save the cart on this device:", error);
    }
  }, [items]);

  const addItem = (product) => setItems((current) => {
    const existing = current.find((line) => line.product._id === product._id);
    if (existing) {
      return current.map((line) => line.product._id === product._id
        ? { ...line, quantity: Math.min(100, line.quantity + 1) }
        : line);
    }
    return [...current, { product, quantity: 1 }];
  });

  const setQuantity = (productId, quantity) => setItems((current) => quantity <= 0
    ? current.filter((line) => line.product._id !== productId)
    : current.map((line) => line.product._id === productId
      ? { ...line, quantity: Math.min(100, Math.floor(quantity)) }
      : line));

  const removeItem = (productId) => setItems((current) => current.filter((line) => line.product._id !== productId));
  const clearCart = () => setItems([]);
  const value = useMemo(() => ({
    items,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
    itemCount: items.reduce((total, line) => total + line.quantity, 0),
    subtotal: items.reduce((total, line) => total + line.quantity * line.product.price * (1 - (line.product.discount || 0) / 100), 0),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
