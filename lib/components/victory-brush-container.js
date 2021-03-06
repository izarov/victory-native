import React from "react";
import PropTypes from "prop-types";
import { Rect, G } from "react-native-svg";
import { flow, defaults, isEqual } from "lodash";
import {
   VictoryBrushContainer, BrushHelpers, brushContainerMixin as originalBrushMixin
} from "victory-brush-container";
import { Selection } from "victory-core";
import VictoryContainer from "./victory-container";
import NativeHelpers from "../helpers/native-helpers";

// ensure the selection component get native styles
const RectWithStyle = ({ style, ...otherProps }) =>
  <Rect {...otherProps} {...NativeHelpers.getStyle(style)} />;

RectWithStyle.propTypes = {
  style: PropTypes.object
};

const nativeBrushMixin = (base) => class VictoryNativeSelectionContainer extends base { // eslint-disable-line max-len
  // assign native specific defaultProps over web `VictoryBrushContainer` defaultProps
  static defaultProps = {
    ...VictoryBrushContainer.defaultProps,
    brushComponent: <RectWithStyle/>,
    handleComponent: <RectWithStyle/>
  };

  // overrides all web events with native specific events
  static defaultEvents = (props) => {
    return [{
      target: "parent",
      eventHandlers: {
        onTouchStart: (evt, targetProps) => {
          if (props.disable) {
            return {};
          }
          BrushHelpers.onMouseMove.cancel();
          return BrushHelpers.onMouseDown(evt, targetProps);
        },
        onTouchMove: (evt, targetProps) => {
          return props.disable ? {} : BrushHelpers.onMouseMove(evt, targetProps);
        },
        onTouchEnd: (evt, targetProps) => {
          if (props.disable) {
            return {};
          }
          BrushHelpers.onMouseMove.cancel();
          return BrushHelpers.onMouseUp(evt, targetProps);
        }
      }
    }];
  };

  // override method in `VictoryBrushContainer` and change <g> to <G>
  // TODO: add a `groupComponent` prop to `VictoryBrushContainer` instead
  getRect(props) {
    const { currentDomain, cachedBrushDomain } = props;
    const brushDomain = defaults({}, props.brushDomain, props.domain);
    const domain = isEqual(brushDomain, cachedBrushDomain) ?
      defaults({}, currentDomain, brushDomain) : brushDomain;
    const coordinates = Selection.getDomainCoordinates(props, domain);
    const selectBox = this.getSelectBox(props, coordinates);
    return selectBox ?
      (
        <G>
          {selectBox}
          {this.getHandles(props, coordinates)}
        </G>
      ) : null;
  }
};

const combinedMixin = flow(originalBrushMixin, nativeBrushMixin);

export const brushContainerMixin = (base) => combinedMixin(base);

export default brushContainerMixin(VictoryContainer);
