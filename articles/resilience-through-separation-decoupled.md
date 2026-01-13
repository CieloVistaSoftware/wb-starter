```javascript
// ✅ Decoupled: OrderService relies on a contract, not an implementation
class OrderService {
  constructor(paymentService) {
    this.paymentService = paymentService; // Injected dependency
  }

  processOrder(order) {
    // Doesn't know if it's Stripe, PayPal, or Mock
    // Just knows it can 'charge'
    if (this.paymentService.charge(order.total)) { 
      this.shipInventory(order);
    }
  }
}
```