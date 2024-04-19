/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {AriaLabelingProps, HoverEvents} from '@react-types/shared';
import {ContextValue, Provider, RenderProps, SlotProps, useContextProps, useRenderProps} from './utils';
import {DropOptions, mergeProps, useButton, useClipboard, useDrop, useFocusRing, useHover, useLocalizedStringFormatter, VisuallyHidden} from 'react-aria';
import {filterDOMProps, useLabels, useSlotId} from '@react-aria/utils';
// @ts-ignore
import intlMessages from '../intl/*.json';
import React, {createContext, ForwardedRef, forwardRef, useRef} from 'react';
import {TextContext} from './Text';

export interface DropZoneRenderProps {
  /**
   * Whether the dropzone is currently hovered with a mouse.
   * @selector [data-hovered]
   */
  isHovered: boolean,
  /**
   * Whether the dropzone is focused, either via a mouse or keyboard.
   * @selector [data-focused]
   */
  isFocused: boolean,
  /**
   * Whether the dropzone is keyboard focused.
   * @selector [data-focus-visible]
   */
  isFocusVisible: boolean,
  /**
   * Whether the dropzone is the drop target.
   * @selector [data-drop-target]
   */
  isDropTarget: boolean,
  /**
   * Whether the dropzone is disabled.
   * @selector [data-disabled]
   */
  isDisabled?: boolean
}

export interface DropZoneProps extends Omit<DropOptions, 'getDropOperationForPoint' | 'ref' | 'hasDropButton'>, HoverEvents, RenderProps<DropZoneRenderProps>, SlotProps, AriaLabelingProps {}

export const DropZoneContext = createContext<ContextValue<DropZoneProps, HTMLDivElement>>(null);

function DropZone(props: DropZoneProps, ref: ForwardedRef<HTMLDivElement>) {
  let {isDisabled} = props;
  [props, ref] = useContextProps(props, ref, DropZoneContext);
  let buttonRef = useRef<HTMLButtonElement>(null);
  let {dropProps, dropButtonProps, isDropTarget} = useDrop({...props, ref: buttonRef, hasDropButton: true});
  let {buttonProps} = useButton(dropButtonProps || {}, buttonRef);
  let {hoverProps, isHovered} = useHover(props);
  let {focusProps, isFocused, isFocusVisible} = useFocusRing();
  let stringFormatter = useLocalizedStringFormatter(intlMessages, 'react-aria-components');

  let textId = useSlotId();
  let dropzoneId = useSlotId();
  let ariaLabel = props['aria-label'] || stringFormatter.format('dropzoneLabel');
  let messageId = props['aria-labelledby'];
  // Chrome + VO will not announce the drop zone's accessible name if useLabels combines an aria-label and aria-labelledby
  let ariaLabelledby = [dropzoneId, textId, messageId].filter(Boolean).join(' ');
  let labelProps = useLabels({'aria-labelledby': ariaLabelledby});

  let {clipboardProps} = useClipboard({
    isDisabled,
    onPaste: (items) => props.onDrop?.({
      type: 'drop',
      items,
      x: 0,
      y: 0,
      dropOperation: 'copy'
    })
  });

  let renderProps = useRenderProps({
    ...props,
    values: {isHovered, isFocused, isFocusVisible, isDropTarget},
    defaultClassName: 'react-aria-DropZone'
  });
  let DOMProps = filterDOMProps(props);
  delete DOMProps.id;

  return (
    <Provider
      values={[
        [TextContext, {id: textId, slot: 'label'}]
      ]}>
      {/* eslint-disable-next-line */}
      <div
        {...mergeProps(dropProps, hoverProps, DOMProps)}
        {...renderProps}
        slot={props.slot || undefined}
        ref={ref}
        onClick={(e) => {
          let target = e.target as HTMLElement;
          if (!target.matches('input')) {
            buttonRef.current?.focus();
          }
        }}
        data-hovered={isHovered || undefined}
        data-focused={isFocused || undefined}
        data-focus-visible={isFocusVisible || undefined}
        data-drop-target={isDropTarget || undefined} 
        data-disabled={isDisabled || undefined}>
        <VisuallyHidden>
          {/* Added as a workaround for a Chrome + VO bug where it will not announce the aria label */}
          <div id={dropzoneId} aria-hidden="true">
            {ariaLabel}
          </div>
          <button
            {...mergeProps(buttonProps, focusProps, clipboardProps, labelProps)}
            type="button"
            ref={buttonRef} />
        </VisuallyHidden>
        {renderProps.children}
      </div>
    </Provider>
  );
}

/**
 * A drop zone is an area into which one or multiple objects can be dragged and dropped.
 */
const _DropZone = forwardRef(DropZone);
export {_DropZone as DropZone};
