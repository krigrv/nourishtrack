"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger> & {
    children?: React.ReactNode | ((open: boolean) => React.ReactNode)
  }
>(({ children, ...props }, ref) => {
  const [open, setOpen] = React.useState(false)
  
  return (
    <CollapsiblePrimitive.Trigger 
      ref={ref} 
      {...props}
      onClick={(e) => {
        setOpen(!open)
        props.onClick?.(e)
      }}
    >
      {typeof children === "function" ? children(open) : children}
    </CollapsiblePrimitive.Trigger>
  )
})
CollapsibleTrigger.displayName = CollapsiblePrimitive.Trigger.displayName

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.Content
    ref={ref}
    className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden"
    {...props}
  />
))
CollapsibleContent.displayName = CollapsiblePrimitive.Content.displayName

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
