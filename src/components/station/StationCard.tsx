// FILE: src/components/station/StationCard.tsx
// STAGE: 9
// UPDATED: 2026-10-02
import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Layers, Users } from 'lucide-react';
import type { Station } from '@prisma/client';

export interface StationCardProps {
  station: Station & {
    _count?: { lanes: number; users: number };
  };
}

export function StationCard({ station }: StationCardProps) {
  const lanesCount = station._count?.lanes ?? 0;
  const usersCount = station._count?.users ?? 0;

  return (
    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
      <Link href={`/stations/${station.id}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold leading-tight hover:underline">
              {station.name}
            </CardTitle>
            <Badge variant="secondary" className="text-[10px] shrink-0 uppercase tracking-wide">
              {station.type.replace(/_/g, ' ')}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{station.address}</span>
          </div>
        </CardHeader>
        <CardContent className="pt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            <span>{lanesCount} {lanesCount === 1 ? 'Lane' : 'Lanes'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{usersCount} {usersCount === 1 ? 'User' : 'Users'}</span>
          </div>
          {!station.isActive && (
            <Badge variant="destructive" className="ml-auto text-[10px]">
              Inactive
            </Badge>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
