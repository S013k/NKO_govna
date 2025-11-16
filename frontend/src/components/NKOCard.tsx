'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Globe, ExternalLink } from 'lucide-react'
import { NKOLogo } from '@/components/NKOLogo'
import Link from 'next/link'
import { NKOResponse } from '@/lib/api'

interface NKOCardProps {
  nko: NKOResponse
}

export function NKOCard({ nko }: NKOCardProps) {
  // DEBUG: Log logo data outside JSX
  console.log('DEBUG: NKOCard - NKO ID:', nko.id, 'Logo field:', nko.logo, 'Name:', nko.name)
  
  return (
    <Card className="bg-white border border-[var(--color-border)] rounded-xl p-6 hover-lift transition-all duration-300 h-full flex flex-col">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-start mb-4">
          <div className="w-16 h-16 bg-[var(--color-bg-secondary)] rounded-lg flex items-center justify-center flex-shrink-0">
            {nko.logo ? (
              <NKOLogo
                logoData={nko.logo}
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
          <div className="flex-1 flex justify-end ml-4">
            <div className="flex flex-col gap-1 items-end">
              {nko.categories.slice(0, 2).map((category, index) => (
                <span key={index} className="px-2 py-1 bg-[rgba(2,94,161,0.1)] text-[var(--color-primary)] rounded-full text-xs font-medium whitespace-nowrap">
                  {category}
                </span>
              ))}
              {nko.categories.length > 2 && (
                <span className="px-2 py-1 bg-[rgba(2,94,161,0.1)] text-[var(--color-primary)] rounded-full text-xs font-medium whitespace-nowrap">
                  ...
                </span>
              )}
            </div>
          </div>
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
        
      </CardContent>

      <CardFooter className="p-0 pt-4 flex flex-col gap-2">
        <Link href={`/nko/${nko.id}`} className="w-full">
          <Button className="w-full btn-primary">
            Подробнее об организации
          </Button>
        </Link>
        
        {nko.meta?.url && (
          <Button
            variant="outline"
            size="sm"
            className="w-full btn-secondary"
            asChild
          >
            <a
              href={nko.meta.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center"
            >
              <Globe className="h-4 w-4 mr-1" />
              Сайт
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}