'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Calendar, Clock, Building, ExternalLink } from 'lucide-react'
import { S3Image } from '@/components/S3Image'
import Link from 'next/link'
import { EventResponse } from '@/lib/api'

interface EventCardProps {
  event: EventResponse
}

export function EventCard({ event }: EventCardProps) {
  // Format date and time
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    return `${day}.${month}.${year} ${hours}:${minutes}`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    
    return `${day}.${month}.${year}`
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    return `${hours}:${minutes}`
  }

  return (
    <Card className="bg-white border border-[var(--color-border)] rounded-xl p-6 hover-lift transition-all duration-300 h-full flex flex-col">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-start mb-4">
          <div className="w-16 h-16 bg-[var(--color-bg-secondary)] rounded-lg flex items-center justify-center flex-shrink-0">
            {event.picture ? (
              <S3Image
                src={`/api/s3/event-pics/${event.picture}`}
                width={64}
                height={64}
                className="w-12 h-12 object-contain rounded-lg"
                alt={event.name}
              />
            ) : (
              <div className="w-12 h-12 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 flex justify-end ml-4">
            <div className="flex flex-col gap-1 items-end">
              {event.categories.slice(0, 2).map((category, index) => (
                <span key={index} className="px-2 py-1 bg-[rgba(2,94,161,0.1)] text-[var(--color-primary)] rounded-full text-xs font-medium whitespace-nowrap">
                  {category}
                </span>
              ))}
              {event.categories.length > 2 && (
                <span className="px-2 py-1 bg-[rgba(2,94,161,0.1)] text-[var(--color-primary)] rounded-full text-xs font-medium whitespace-nowrap">
                  ...
                </span>
              )}
            </div>
          </div>
        </div>
        
        <h3 className="font-bold text-lg text-[var(--color-text-primary)] mb-2 line-clamp-2">
          {event.name}
        </h3>
        
        {/* Date and Time */}
        <div className="flex items-center text-[var(--color-text-secondary)] text-sm mb-2">
          <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="font-medium">{formatDate(event.starts_at)}</span>
          {event.starts_at && (
            <>
              <Clock className="h-4 w-4 ml-3 mr-2 flex-shrink-0" />
              <span>{formatTime(event.starts_at)}</span>
            </>
          )}
        </div>
        
        {/* Organizing NKO */}
        {event.nko_name && (
          <div className="flex items-center text-[var(--color-text-secondary)] text-sm mb-2">
            <Building className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="line-clamp-1">{event.nko_name}</span>
          </div>
        )}
        
        <p className="text-[var(--color-text-secondary)] text-sm line-clamp-3">
          {event.description}
        </p>
      </CardHeader>

      <CardContent className="p-0 flex-1">
        {event.address && (
          <div className="flex items-center text-[var(--color-text-secondary)] text-sm mb-2">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="line-clamp-1">{event.address}</span>
          </div>
        )}
        
        {/* End time if different from start time */}
        {event.finish_at && event.starts_at && 
         new Date(event.finish_at).toDateString() !== new Date(event.starts_at).toDateString() && (
          <div className="flex items-center text-[var(--color-text-secondary)] text-sm">
            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>До: {formatDate(event.finish_at)}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-0 pt-4 flex flex-col gap-2">
        <Link href={`/events/${event.id}`} className="w-full">
          <Button className="w-full btn-primary">
            Подробнее о событии
          </Button>
        </Link>
        
        {event.nko_id && (
          <Button
            variant="outline"
            size="sm"
            className="w-full btn-secondary"
            asChild
          >
            <Link href={`/nko/${event.nko_id}`}>
              <Building className="h-4 w-4 mr-1" />
              Организатор
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}