import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext({});

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // Добавить товар в корзину
  const addItem = useCallback((menuItem) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  }, []);

  // Убрать единицу товара из корзины
  const removeItem = useCallback((menuItemId) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.menuItem.id === menuItemId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.menuItem.id === menuItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter((item) => item.menuItem.id !== menuItemId);
    });
  }, []);

  // Полностью удалить товар
  const removeItemFully = useCallback((menuItemId) => {
    setItems((prev) => prev.filter((item) => item.menuItem.id !== menuItemId));
  }, []);

  // Установить конкретное количество
  const updateQuantity = useCallback((menuItemId, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.menuItem.id !== menuItemId));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.menuItem.id === menuItemId
          ? { ...item, quantity }
          : item
      )
    );
  }, []);

  // Очистить корзину
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Получить количество конкретного товара
  const getItemQuantity = useCallback(
    (menuItemId) => {
      const item = items.find((i) => i.menuItem.id === menuItemId);
      return item ? item.quantity : 0;
    },
    [items]
  );

  // Общее количество товаров
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Общая стоимость
  const totalPrice = items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );

  const value = {
    items,
    addItem,
    removeItem,
    removeItemFully,
    updateQuantity,
    clearCart,
    getItemQuantity,
    totalCount,
    totalPrice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
