import React from "react";
import PropTypes from "prop-types";

const Image = (props) => {
  return (
    <img
      className={props.className}
      src={props.src}
      height={props.height}
      alt={props.alt}
      width={props.width}
      id={props.id}
    />
  );
};

Image.propTypes = {
  className: PropTypes.string,
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  height: PropTypes.number,
  width: PropTypes.number,
  id: PropTypes.string,
};

export default Image;
