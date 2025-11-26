/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Before/After Gallery Component
 * Story 4.4: Job Progress Tracking and Completion
 * AC #21: Photo gallery with before/after comparison view
 */

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  X,
  Grid,
  Columns,
  Maximize2,
} from 'lucide-react';

interface BeforeAfterGalleryProps {
  beforePhotos: string[];
  afterPhotos: string[];
}

type ViewMode = 'grid' | 'comparison' | 'gallery';

export function BeforeAfterGallery({ beforePhotos, afterPhotos }: BeforeAfterGalleryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxTitle, setLightboxTitle] = useState('');

  const hasBeforePhotos = beforePhotos && beforePhotos.length > 0;
  const hasAfterPhotos = afterPhotos && afterPhotos.length > 0;

  if (!hasBeforePhotos && !hasAfterPhotos) {
    return null;
  }

  const openLightbox = (photos: string[], index: number, title: string) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setLightboxTitle(title);
    setLightboxOpen(true);
  };

  const nextPhoto = () => {
    if (lightboxIndex < lightboxPhotos.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      prevPhoto();
    } else if (e.key === 'ArrowRight') {
      nextPhoto();
    } else if (e.key === 'Escape') {
      setLightboxOpen(false);
    }
  };

  return (
    <>
      <Card data-testid="gallery-work-order-photos">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Photo Gallery
            </CardTitle>

            {/* View Mode Toggle - only show if both types exist */}
            {hasBeforePhotos && hasAfterPhotos && (
              <div className="flex gap-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'comparison' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('comparison')}
                  aria-label="Comparison view"
                  aria-pressed={viewMode === 'comparison'}
                >
                  <Columns className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'grid' && (
            <Tabs defaultValue={hasBeforePhotos ? 'before' : 'after'} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="before" disabled={!hasBeforePhotos}>
                  Before ({beforePhotos?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="after" disabled={!hasAfterPhotos}>
                  After ({afterPhotos?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="before">
                {hasBeforePhotos ? (
                  <PhotoGrid
                    photos={beforePhotos}
                    onPhotoClick={(index) => openLightbox(beforePhotos, index, 'Before Photos')}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No before photos available
                  </p>
                )}
              </TabsContent>

              <TabsContent value="after">
                {hasAfterPhotos ? (
                  <PhotoGrid
                    photos={afterPhotos}
                    onPhotoClick={(index) => openLightbox(afterPhotos, index, 'After Photos')}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No after photos available
                  </p>
                )}
              </TabsContent>
            </Tabs>
          )}

          {viewMode === 'comparison' && hasBeforePhotos && hasAfterPhotos && (
            <ComparisonView
              beforePhotos={beforePhotos}
              afterPhotos={afterPhotos}
              onPhotoClick={(photos, index, title) => openLightbox(photos, index, title)}
            />
          )}
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="max-w-4xl p-0"
          onKeyDown={handleKeyDown}
          aria-describedby="lightbox-description"
        >
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span>{lightboxTitle} - {lightboxIndex + 1} of {lightboxPhotos.length}</span>
            </DialogTitle>
          </DialogHeader>
          <p id="lightbox-description" className="sr-only">
            Photo viewer. Use arrow keys to navigate between photos.
          </p>
          <div className="relative aspect-video bg-black">
            {lightboxPhotos[lightboxIndex] && (
              <Image
                src={lightboxPhotos[lightboxIndex]}
                alt={`${lightboxTitle} ${lightboxIndex + 1}`}
                fill
                className="object-contain"
              />
            )}

            {/* Navigation buttons */}
            {lightboxIndex > 0 && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2"
                onClick={prevPhoto}
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}
            {lightboxIndex < lightboxPhotos.length - 1 && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={nextPhoto}
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}
          </div>

          {/* Thumbnails */}
          {lightboxPhotos.length > 1 && (
            <div className="p-4 pt-2 flex gap-2 overflow-x-auto">
              {lightboxPhotos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setLightboxIndex(index)}
                  className={`relative h-16 w-16 shrink-0 rounded-md overflow-hidden border-2 transition-colors ${
                    index === lightboxIndex
                      ? 'border-primary'
                      : 'border-transparent hover:border-muted-foreground/50'
                  }`}
                  aria-label={`View photo ${index + 1}`}
                  aria-current={index === lightboxIndex}
                >
                  <Image
                    src={photo}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Photo Grid Component
function PhotoGrid({
  photos,
  onPhotoClick,
}: {
  photos: string[];
  onPhotoClick: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3" role="list" aria-label="Photo gallery">
      {photos.map((photo, index) => (
        <div key={index} role="listitem">
          <button
            onClick={() => onPhotoClick(index)}
            className="group relative aspect-square rounded-lg border overflow-hidden hover:ring-2 hover:ring-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary w-full"
            aria-label={`View photo ${index + 1} of ${photos.length}`}
          >
          <Image
            src={photo}
            alt={`Photo ${index + 1}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          </button>
        </div>
      ))}
    </div>
  );
}

// Side-by-Side Comparison View
function ComparisonView({
  beforePhotos,
  afterPhotos,
  onPhotoClick,
}: {
  beforePhotos: string[];
  afterPhotos: string[];
  onPhotoClick: (photos: string[], index: number, title: string) => void;
}) {
  const maxPairs = Math.max(beforePhotos.length, afterPhotos.length);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Side-by-side comparison of before and after photos
      </p>

      {Array.from({ length: maxPairs }).map((_, index) => (
        <div key={index} className="grid grid-cols-2 gap-4" role="group" aria-label={`Comparison ${index + 1}`}>
          {/* Before */}
          <div className="space-y-2">
            {index === 0 && (
              <Badge variant="outline" className="mb-2">Before</Badge>
            )}
            {beforePhotos[index] ? (
              <button
                onClick={() => onPhotoClick(beforePhotos, index, 'Before Photos')}
                className="group relative aspect-video w-full rounded-lg border overflow-hidden hover:ring-2 hover:ring-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={`Before photo ${index + 1}`}
              >
                <Image
                  src={beforePhotos[index]}
                  alt={`Before photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ) : (
              <div className="aspect-video w-full rounded-lg border border-dashed flex items-center justify-center bg-muted/50">
                <span className="text-sm text-muted-foreground">No photo</span>
              </div>
            )}
          </div>

          {/* After */}
          <div className="space-y-2">
            {index === 0 && (
              <Badge variant="outline" className="mb-2">After</Badge>
            )}
            {afterPhotos[index] ? (
              <button
                onClick={() => onPhotoClick(afterPhotos, index, 'After Photos')}
                className="group relative aspect-video w-full rounded-lg border overflow-hidden hover:ring-2 hover:ring-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={`After photo ${index + 1}`}
              >
                <Image
                  src={afterPhotos[index]}
                  alt={`After photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ) : (
              <div className="aspect-video w-full rounded-lg border border-dashed flex items-center justify-center bg-muted/50">
                <span className="text-sm text-muted-foreground">No photo</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
