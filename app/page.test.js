/* eslint-disable no-undef */
import { getDisplayDate } from './page';

describe('Function: getDisplayDate', () => {
  describe('When edited date is the same as created date', () => {
    it('should return a string indicating the published date', () => {
      const date = '2022-01-01';
      expect(getDisplayDate(date, date)).toBe(`Published: <strong>${date}</strong>`);
    });
  });

  describe('When edited date is different from created date', () => {
    it('should return a string indicating the revised date', () => {
      const createdDate = '2022-01-01';
      const editedDate = '2022-01-02';
      expect(getDisplayDate(editedDate, createdDate)).toBe(`Revised: <strong>${editedDate}</strong>`);
    });
  });
});
