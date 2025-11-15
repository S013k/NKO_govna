'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Mail, Globe, ExternalLink } from 'lucide-react'
import { NKOLogo } from '@/components/NKOLogo'
import Link from 'next/link'
import { NKO } from '@/data/nko'

interface NKOCardProps {
  nko: NKO
}

export function NKOCard({ nko }: NKOCardProps) {
  return (
    <Card className="bg-white border border-[var(--color-border)] rounded-xl p-6 hover-lift transition-all duration-300 h-full flex flex-col">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="w-16 h-16 bg-[var(--color-bg-secondary)] rounded-lg flex items-center justify-center">
            {nko.logo ? (
              <NKOLogo
                logoId={nko.id}
                width={64}
                height={64}
                className="w-12 h-12 object-contain"
                alt={nko.name}
              />
            ) : (
              <div className="w-12 h-12 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {nko.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <span className="px-3 py-1 bg-[rgba(2,94,161,0.1)] text-[var(--color-primary)] rounded-full text-sm font-medium">
            {nko.category}
          </span>
        </div>
        
        <h3 className="font-bold text-lg text-[var(--color-text-primary)] mb-2 line-clamp-2">
          {nko.name}
        </h3>
        
        <p className="text-[var(--color-text-secondary)] text-sm line-clamp-3">
          {nko.description}
        </p>
      </CardHeader>

      <CardContent className="p-0 flex-1">
        {nko.address && (
          <div className="flex items-center text-[var(--color-text-secondary)] text-sm mb-2">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="line-clamp-1">{nko.address}</span>
          </div>
        )}
        
        {nko.volunteerFunction && (
          <div className="mt-4 p-3 bg-[var(--color-bg-secondary)] rounded-lg">
            <p className="text-xs font-medium text-[var(--color-text-primary)] mb-1">
              Что могут делать волонтеры:
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
              {nko.volunteerFunction}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-0 pt-4 flex flex-col gap-2">
        <Link href={`/nko/${nko.id}`} className="w-full">
          <Button className="w-full btn-primary">
            Подробнее об организации
          </Button>
        </Link>
        
        <div className="flex gap-2 w-full">
          {nko.website && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 btn-secondary"
              asChild
            >
              <a
                href={nko.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center"
              >
                <Globe className="h-4 w-4 mr-1" />
                Сайт
              </a>
            </Button>
          )}
          
          {nko.phone && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 btn-secondary"
              asChild
            >
              <a href={`tel:${nko.phone}`} className="flex items-center justify-center">
                <Phone className="h-4 w-4 mr-1" />
                Позвонить
              </a>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}