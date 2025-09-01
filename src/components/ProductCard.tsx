import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import ShippingModal from './ShippingModal';

const ProductCard = ({ product, onViewDetails }) => {
  const [showShipping, setShowShipping] = useState(false);

  const handleBuyNow = (e) => {
    e.stopPropagation();
    setShowShipping(true);
  };

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
        onClick={onViewDetails}
      >
        <CardContent className="p-0">
          <div className="aspect-square bg-muted rounded-t-lg flex items-center justify-center overflow-hidden">
            <img 
              src={product.image} 
              alt={product.name} 
              className="object-contain w-full h-full"
            />
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-foreground mb-2">{product.name}</h3>
            <p className="text-muted-foreground mb-4">{product.description}</p>
            <div className="text-2xl font-bold text-primary">₹{product.price}</div>
          </div>
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <Button 
            onClick={handleBuyNow}
            className="w-full"
            size="lg"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Buy Now
          </Button>
        </CardFooter>
      </Card>

      {showShipping && (
        <ShippingModal
          product={product}
          onClose={() => setShowShipping(false)}
        />
      )}
    </>
  );
};

export default ProductCard;
