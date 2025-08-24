import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Truck, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ShippingModal = ({ product, selectedSize = 'M', onClose }) => {
  const { toast } = useToast();
  const [step, setStep] = useState('shipping'); // 'shipping' or 'payment'
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  });
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    toast({
      title: "Order Placed Successfully!",
      description: `Your ${product.name} (Size: ${selectedSize}) will be shipped to ${shippingInfo.address}`,
    });
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {step === 'shipping' ? (
                <>
                  <Truck className="w-5 h-5" />
                  <span>Shipping Information</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Payment Information</span>
                </>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Order Summary */}
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Order Summary</h3>
          <div className="flex justify-between items-center">
            <span>{product.name} - Size {selectedSize}</span>
            <span className="font-semibold">${product.price}</span>
          </div>
          <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between items-center font-bold">
            <span>Total</span>
            <span>${product.price}</span>
          </div>
        </div>

        {step === 'shipping' ? (
          <form onSubmit={handleShippingSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={shippingInfo.fullName}
                  onChange={(e) => setShippingInfo(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={shippingInfo.email}
                  onChange={(e) => setShippingInfo(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={shippingInfo.address}
                onChange={(e) => setShippingInfo(prev => ({ ...prev, address: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={shippingInfo.city}
                  onChange={(e) => setShippingInfo(prev => ({ ...prev, city: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={shippingInfo.state}
                  onChange={(e) => setShippingInfo(prev => ({ ...prev, state: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={shippingInfo.zipCode}
                  onChange={(e) => setShippingInfo(prev => ({ ...prev, zipCode: e.target.value }))}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Continue to Payment
            </Button>
          </form>
        ) : (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div>
              <Label htmlFor="cardName">Name on Card</Label>
              <Input
                id="cardName"
                value={paymentInfo.cardName}
                onChange={(e) => setPaymentInfo(prev => ({ ...prev, cardName: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={paymentInfo.cardNumber}
                onChange={(e) => setPaymentInfo(prev => ({ ...prev, cardNumber: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/YY"
                  value={paymentInfo.expiryDate}
                  onChange={(e) => setPaymentInfo(prev => ({ ...prev, expiryDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={paymentInfo.cvv}
                  onChange={(e) => setPaymentInfo(prev => ({ ...prev, cvv: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <Button type="button" variant="outline" onClick={() => setStep('shipping')} className="flex-1">
                Back to Shipping
              </Button>
              <Button type="submit" className="flex-1">
                Place Order - ${product.price}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShippingModal;