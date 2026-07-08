export type VideoGenerationProvider = "genapi";

export type VideoGenerationModel = "veo-3-1-fast";

export type VideoGenerationStatus =
  | "created"
  | "payment_pending"
  | "paid"
  | "queued"
  | "processing"
  | "done"
  | "error"
  | "cancelled";

export type VideoAspectRatio = "1:1" | "4:5" | "9:16" | "16:9";

export type VideoDuration = "4" | "6" | "8";

export type VideoQuality = "standard" | "pro";

export type VideoMotionStyle =
  | "soft_zoom"
  | "premium_parallax"
  | "light_sweep"
  | "marketplace_motion";

export type VideoGenerationRecord = {
  id: string;
  userId: string;
  sourceGenerationId: string;
  sourceImageUrl: string;
  provider: VideoGenerationProvider;
  model: VideoGenerationModel;
  status: VideoGenerationStatus;
  duration: VideoDuration;
  aspectRatio: VideoAspectRatio;
  quality: VideoQuality;
  motionStyle: VideoMotionStyle;
  prompt: string;
  amountRub?: number;
  paymentId?: string;
  externalTaskId?: string;
  originalVideoUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
};

export type CreateVideoOrderInput = {
  sourceGenerationId: string;
  duration: VideoDuration;
  aspectRatio: VideoAspectRatio;
  quality: VideoQuality;
  motionStyle: VideoMotionStyle;
};

export type CreateVideoOrderResponse = {
  orderId: string;
  status: VideoGenerationStatus;
  amountRub: number;
  paymentUrl?: string;
  usedVideoCredit?: boolean;
  isFree?: boolean;
};

export type VideoOrderStatusResponse = {
  orderId: string;
  status: VideoGenerationStatus;
  originalVideoUrl: string | null;
  error: string | null;
};
