import React from 'react';
import { shallow } from 'enzyme';
import Scene from 'components/Scene.js';

describe('<Scene />', function () {

  let component;
  beforeEach(function () {
    component = shallow(<Scene />);
  });

  describe('when rendering the component', function () {

    it('should have a className of "scene-component"', function () {
      expect(component.hasClass('scene-component')).to.equal(true);
    });
  });
});
