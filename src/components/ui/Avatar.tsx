import React from 'react'
import Image from 'next/image'
import type { User } from '@/payload-types'
import { getUserAvatar, AvatarDescriptor } from '@/lib/avatar'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg'

export interface AvatarProps {
  user?: Partial<User> | { id?: number | string | null; name?: string | null; avatar?: unknown } | null
  size?: AvatarSize
  decorative?: boolean
  className?: string
  alt?: string
}

const SIZE_MAP: Record<AvatarSize, { px: number; className: string }> = {
  xs: { px: 20, className: 'avatar--xs' },
  sm: { px: 28, className: 'avatar--sm' },
  md: { px: 40, className: 'avatar--md' },
  lg: { px: 72, className: 'avatar--lg' },
}

export function Avatar({
  user,
  size = 'md',
  decorative = true,
  className = '',
  alt: customAlt,
}: AvatarProps) {
  const avatar: AvatarDescriptor = getUserAvatar(user)
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md

  const computedAlt = decorative
    ? ''
    : customAlt || (user?.name ? `${user.name}’s avatar` : avatar.alt)

  return (
    <span
      className={`avatar-wrapper ${sizeConfig.className} ${className}`.trim()}
      aria-hidden={decorative ? 'true' : undefined}
    >
      <Image
        src={avatar.url}
        alt={computedAlt}
        width={sizeConfig.px}
        height={sizeConfig.px}
        className="avatar-image"
        priority={size === 'lg'}
        unoptimized
      />
    </span>
  )
}
