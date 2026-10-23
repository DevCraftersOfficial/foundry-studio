import React from 'react'
import type { ServerProps, VisibleEntities } from 'payload'
import { NavWrapper } from '@payloadcms/next/client'
import { StudioNavClient } from './StudioNavClient'

interface TypedUserWithProfile {
  name?: string | null
  role?: string
}

export type StudioNavProps = ServerProps & {
  visibleEntities?: VisibleEntities
}

export const StudioNav: React.FC<StudioNavProps> = (props) => {
  const { user, permissions, visibleEntities } = props
  const typedUser = user as unknown as TypedUserWithProfile | undefined

  return (
    <NavWrapper baseClass="nav">
      <StudioNavClient
        user={
          user
            ? {
                id: user.id,
                email: user.email,
                name: typedUser?.name || null,
                role: typedUser?.role || 'author',
              }
            : null
        }
        permissions={permissions}
        visibleEntities={visibleEntities}
      />
    </NavWrapper>
  )
}
