declare global {
  interface Window {
    __RAZORPAY_KEY__: string;
    Razorpay: any;
  }
}

export {};

