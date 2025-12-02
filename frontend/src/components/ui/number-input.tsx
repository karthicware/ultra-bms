'use client'

import * as React from 'react'
import { MinusIcon, PlusIcon } from 'lucide-react'
import { Button, Group, Input, NumberField } from 'react-aria-components'

import { cn } from '@/lib/utils'

type NumberInputProps = {
  value?: number | null | string
  defaultValue?: number
  onChange?: (value: number) => void
  onBlur?: () => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  placeholder?: string
  className?: string
  id?: string
  name?: string
  'data-testid'?: string
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      onBlur,
      min = 0,
      max,
      step = 1,
      disabled,
      placeholder,
      className,
      id,
      name,
      'data-testid': dataTestId
    },
    ref
  ) => {
    // Convert null/string values to number or undefined
    const numericValue = value === null || value === '' ? undefined : typeof value === 'string' ? parseFloat(value) || undefined : value

    return (
      <NumberField
        value={numericValue}
        defaultValue={defaultValue}
        onChange={onChange}
        minValue={min}
        maxValue={max}
        step={step}
        isDisabled={disabled}
        className={cn('w-full', className)}
      >
        <Group className='dark:bg-input/30 border-input data-focus-within:border-ring data-focus-within:ring-ring/50 data-focus-within:has-aria-invalid:ring-destructive/20 dark:data-focus-within:has-aria-invalid:ring-destructive/40 data-focus-within:has-aria-invalid:border-destructive relative inline-flex h-9 w-full min-w-0 items-center overflow-hidden rounded-md border bg-transparent text-base whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-within:ring-[3px] md:text-sm'>
          <Input
            ref={ref}
            id={id}
            name={name}
            placeholder={placeholder}
            onBlur={onBlur}
            data-testid={dataTestId}
            className='selection:bg-primary selection:text-primary-foreground w-full grow px-3 py-2 text-center tabular-nums outline-none bg-transparent placeholder:text-muted-foreground'
          />
          <Button
            slot='decrement'
            className='border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground mr-1.5 flex aspect-square h-5 items-center justify-center rounded-sm border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
          >
            <MinusIcon className='size-3' />
            <span className='sr-only'>Decrement</span>
          </Button>
          <Button
            slot='increment'
            className='border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground mr-2 flex aspect-square h-5 items-center justify-center rounded-sm border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
          >
            <PlusIcon className='size-3' />
            <span className='sr-only'>Increment</span>
          </Button>
        </Group>
      </NumberField>
    )
  }
)

NumberInput.displayName = 'NumberInput'

export { NumberInput }
