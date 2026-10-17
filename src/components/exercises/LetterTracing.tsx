import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Eraser, SkipForward, CheckCircle2 } from 'lucide-react';
import type { LetterTracingData } from '@/types/lesson';
import { useTranslation } from 'react-i18next';

interface LetterTracingProps {
  data: LetterTracingData;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  answerStatus: 'idle' | 'correct' | 'wrong';
}

interface Point {
  x: number;
  y: number;
}

export function LetterTracing({
  data,
  selectedAnswer,
  onSelect,
  answerStatus,
}: LetterTracingProps) {
  const { t } = useTranslation();
  const isRTL = t('lang.ar') === 'العربية';
  const showResult = answerStatus !== 'idle';

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guideCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const strokesRef = useRef<Point[][]>([]);
  const currentStrokeRef = useRef<Point[]>([]);

  const CANVAS_SIZE = 280;

  // Draw the guide letter on a separate canvas behind the drawing canvas
  useEffect(() => {
    const guideCanvas = guideCanvasRef.current;
    if (!guideCanvas) return;
    const ctx = guideCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = 'rgba(13, 115, 119, 0.12)';
    ctx.font = `200px Vazirmatn, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    ctx.fillText(data.letter, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 10);
  }, [data.letter]);

  const getPoint = useCallback((clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback((clientX: number, clientY: number) => {
    if (showResult) return;
    setIsDrawing(true);
    currentStrokeRef.current = [getPoint(clientX, clientY)];
  }, [getPoint, showResult]);

  const draw = useCallback((clientX: number, clientY: number) => {
    if (!isDrawing || showResult) return;
    const point = getPoint(clientX, clientY);
    currentStrokeRef.current.push(point);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const points = currentStrokeRef.current;
    if (points.length < 2) return;
    const prev = points[points.length - 2];
    ctx.strokeStyle = '#0d7377';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }, [isDrawing, getPoint, showResult]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStrokeRef.current.length > 1) {
      strokesRef.current.push(currentStrokeRef.current);
      setHasDrawn(true);
    }
    currentStrokeRef.current = [];
  }, [isDrawing]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    strokesRef.current = [];
    currentStrokeRef.current = [];
    setHasDrawn(false);
  }, []);

  const computeCoverage = useCallback((): number => {
    const guideCanvas = guideCanvasRef.current;
    const drawCanvas = canvasRef.current;
    if (!guideCanvas || !drawCanvas) return 0;

    const guideCtx = guideCanvas.getContext('2d');
    const drawCtx = drawCanvas.getContext('2d');
    if (!guideCtx || !drawCtx) return 0;

    const guideData = guideCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const drawData = drawCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    let guidePixels = 0;
    let coveredPixels = 0;

    for (let i = 0; i < guideData.data.length; i += 4) {
      const guideAlpha = guideData.data[i + 3];

      if (guideAlpha > 20) {
        guidePixels++;
        // Check a small neighborhood around each guide pixel
        const pixelIdx = i / 4;
        const px = pixelIdx % CANVAS_SIZE;
        const py = Math.floor(pixelIdx / CANVAS_SIZE);
        let found = false;
        for (let dy = -6; dy <= 6 && !found; dy++) {
          for (let dx = -6; dx <= 6 && !found; dx++) {
            const nx = px + dx;
            const ny = py + dy;
            if (nx >= 0 && nx < CANVAS_SIZE && ny >= 0 && ny < CANVAS_SIZE) {
              const nIdx = (ny * CANVAS_SIZE + nx) * 4 + 3;
              if (drawData.data[nIdx] > 20) {
                found = true;
              }
            }
          }
        }
        if (found) coveredPixels++;
      }
    }

    if (guidePixels === 0) return 0;
    return Math.min(100, Math.round((coveredPixels / guidePixels) * 100));
  }, []);

  const handleSubmit = useCallback(() => {
    const score = computeCoverage();
    onSelect(score.toString());
  }, [computeCoverage, onSelect]);

  // Prevent page scroll while drawing on touch
  const preventScroll = useCallback((e: TouchEvent) => {
    if (isDrawing) e.preventDefault();
  }, [isDrawing]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('touchmove', preventScroll, { passive: false });
    return () => container.removeEventListener('touchmove', preventScroll);
  }, [preventScroll]);

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted text-center">
          {isRTL ? 'ارسم الحرف بتتبّع المخطط الخفيف' : 'Trace the letter by following the faint guide'}
        </p>
      </div>

      <div className="flex justify-center">
        <div
          className="relative rounded-2xl border-2 border-primary-200 dark:border-primary-800 bg-white dark:bg-neutral-900 overflow-hidden"
          style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, touchAction: 'none' }}
        >
          {/* Guide canvas (faint letter behind) */}
          <canvas
            ref={guideCanvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="absolute inset-0"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
          />
          {/* Drawing canvas (user strokes on top) */}
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="absolute inset-0 cursor-crosshair"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, touchAction: 'none' }}
            onMouseDown={(e) => startDrawing(e.clientX, e.clientY)}
            onMouseMove={(e) => draw(e.clientX, e.clientY)}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              startDrawing(touch.clientX, touch.clientY);
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              draw(touch.clientX, touch.clientY);
            }}
            onTouchEnd={stopDrawing}
          />
          {showResult && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <CheckCircle2
                  size={48}
                  className={answerStatus === 'correct' ? 'text-success-500' : 'text-error-500'}
                />
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      {!showResult && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleClear}
            disabled={!hasDrawn}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
          >
            <Eraser size={16} />
            {isRTL ? 'مسح' : 'Clear'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!hasDrawn}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-40 transition-colors"
          >
            {isRTL ? 'تحقّق' : 'Check'}
          </button>
          <button
            onClick={() => onSelect('0')}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <SkipForward size={16} />
            {isRTL ? 'تخطّي' : 'Skip'}
          </button>
        </div>
      )}

      {showResult && (
        <div className="text-center">
          <p className="text-sm font-semibold">
            {answerStatus === 'correct'
              ? (isRTL ? 'أحسنت! تتبّع جيد' : 'Great tracing!')
              : (isRTL ? 'حاول مرة أخرى في المرة القادمة' : 'Try again next time')}
          </p>
          <p className="text-xs text-muted mt-1">
            {isRTL ? `نسبة التغطية: ${selectedAnswer ?? '0'}%` : `Coverage: ${selectedAnswer ?? '0'}%`}
          </p>
        </div>
      )}
    </div>
  );
}

export default LetterTracing;
