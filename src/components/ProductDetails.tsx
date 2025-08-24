import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, X, ArrowLeft } from 'lucide-react';
import ShippingModal from './ShippingModal';

const ProductDetails = ({ product, onClose }) => {
  const [showShipping, setShowShipping] = useState(false);
  const [selectedSize, setSelectedSize] = useState('M');

  const handleBuyNow = () => {
    setShowShipping(true);
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="-ml-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Shop
                </Button>
                <span>{product.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              <div className="text-9xl opacity-50">👕</div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">{product.name}</h3>
                <p className="text-muted-foreground mb-4">{product.description}</p>
                <div className="text-3xl font-bold text-primary">${product.price}</div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Color</h4>
                <div className="text-muted-foreground">{product.color}</div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Size</h4>
                <div className="flex gap-2">
                  {product.sizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Button onClick={handleBuyNow} className="w-full" size="lg">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy Now - ${product.price}
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <h4 className="font-semibold mb-2">Product Details:</h4>
                <ul className="space-y-1">
                  <li>• Premium moisture-wicking fabric</li>
                  <li>• Official team colors and design</li>
                  <li>• Machine washable</li>
                  <li>• Comfortable athletic fit</li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showShipping && (
        <ShippingModal
          product={product}
          selectedSize={selectedSize}
          onClose={() => setShowShipping(false)}
        />
      )}
    </>
  );
};

export default ProductDetails;