```javascript
// ❌ Tight Coupling: The OrderService knows EVERYTHING about Payment
class OrderService {
  processOrder(order) {
    // Direct dependency on a specific implementation (Stripe)
    const payment = new StripePaymentService(); 
    
    // Knows internal details: that 'chargeCard' exists and needs 'USD'
    if (payment.chargeCard(order.total, 'USD')) { 
      this.shipInventory(order);
    }
  }
}
```