import { isNumber } from 'lodash';
import { ToolStyleUtils } from '@labelbee/lb-utils';
import { ELang } from '../../constant/annotation';
import { IPolygonData } from '../../types/tool/polygon';
import { COLORS_ARRAY, ICON_ARRAY, INVALID_ICON, NULL_COLOR, NULL_ICON } from '../../constant/style';
import { ETextType } from '../../constant/tool';
import locale from '../../locales';
import { EMessage } from '../../locales/constants';
import MathUtils from '../MathUtils';

export const ATTRIBUTE_COLORS = [NULL_COLOR].concat(COLORS_ARRAY);

export const REGEXP_NUMBER = '^[0-9]+$';
export const REGEXP_ENGLISH = '^[A-Za-z]+$';

export default class AttributeUtils {
  /**
   * 获取属性icon
   * @param attribute
   * @param attributeList
   */
  public static getAttributeIcon(attribute: string, attributeList: IInputList[], valid = true) {
    const attributeIndex = attributeList.findIndex((i: any) => i.value === attribute);
    let src = ICON_ARRAY[attributeIndex % ICON_ARRAY.length] ?? NULL_ICON;
    if (!valid) {
      src = INVALID_ICON;
    }
    src = '';
    const img = new Image();
    img.src = src;
    return img;
  }

  /**
   * 获取正则校验的string
   * @param textCheckType
   * @param customFormat
   */
  public static checkString(textCheckType: number, customFormat: string) {
    let regExpString = '';
    switch (textCheckType) {
      case ETextType.Order:
      case ETextType.NumberOnly:
        regExpString = REGEXP_NUMBER;
        break;
      case ETextType.EnglishOnly:
        regExpString = REGEXP_ENGLISH;
        break;
      case ETextType.CustomFormat:
        regExpString = customFormat;
        break;
      default: {
        break;
      }
    }
    return regExpString;
  }

  /**
   *
   * @param value 检测的值
   * @param checkString RegExp string
   */
  public static checkTextAttibute(value: string | undefined, checkStrings: string) {
    if (value === undefined || value === '') {
      return true;
    }
    try {
      return new RegExp(checkStrings).test(value);
    } catch (error) {
      // message.destroy();
      // message.error('正则表达式填写错误');
      return false;
    }
  }

  /**
   * 获取属性标注显示的数据
   * @param attribute
   * @param attributeList
   * @returns {string} 标注属性
   */
  public static getAttributeShowText(attribute: string | undefined, attributeList: IInputList[] = []) {
    try {
      const attributeIndex = attributeList.findIndex((i: any) => i.value === attribute);
      return attributeList[attributeIndex]?.key ?? attribute;
    } catch (error) {
      return attribute;
    }
  }

  /**
   * 获取属性标注的索引
   * @param attribute
   * @param attributeList
   * @returns {number} 属性索引
   */
  public static getAttributeIndex(attribute: string | undefined, attributeList: IInputList[]) {
    try {
      const attributeIndex = attributeList.findIndex((i: any) => i.value === attribute);
      if (attributeIndex >= 8) {
        // 大于指定颜色范围后需要循环

        return attributeIndex % 8;
      }

      return attributeIndex;
    } catch (error) {
      return -1;
    }
  }

  /**
   * 获取属性标注的索引
   * @param attribute
   * @param attributeList
   * @returns {string} 颜色hex值
   */
  public static getAttributeColor(attribute: string | undefined, attributeList: IInputList[]) {
    try {
      const attributeIndex = this.getAttributeIndex(attribute, attributeList);
      if (attributeIndex === -1) {
        return NULL_COLOR;
      }
      return COLORS_ARRAY[attributeIndex % COLORS_ARRAY.length];
    } catch (error) {
      return NULL_COLOR;
    }
  }

  /**
   * 文本标注：自动获取下一个序号（取当前数据的最大值 + 1）
   * @param toolResultList 工具的结果集
   * @param textCheckType
   */
  public static getTextAttribute(toolResultList: IRect[] | IPolygonData[] | IPoint[] | ILine[], textCheckType: number) {
    try {
      if (textCheckType === ETextType.Order) {
        const textAttributeList = toolResultList
          .map<number | undefined>((i: any) => parseInt(i.textAttribute, 10))
          .filter((order: any) => {
            return isNumber(order) && order < Number.MAX_SAFE_INTEGER && order >= 0;
          });
        textAttributeList.sort((a: any, b: any) => a - b);
        const maxOrder = textAttributeList.pop();
        return `${(maxOrder || 0) + 1}`;
      }
      return '';
    } catch (error) {
      return '';
    }
  }

  /**
   * 更改数据的textAttribute
   * @param value
   * @param selectedID  工具中选中数据的ID
   * @param toolList 工具的结果集
   */

  public static textChange(value: string | undefined, selectedID: string, toolList: any[]) {
    return toolList.map((item) => {
      if (item.id === selectedID) {
        return {
          ...item,
          textAttribute: value,
        };
      }
      return item;
    });
  }

  /**
   * 获取错误提示的文案
   * @param textCheckType
   */
  public static getErrorNotice(textCheckType: number, lang: ELang) {
    switch (textCheckType) {
      case ETextType.Order:
      case ETextType.NumberOnly:
        return locale.getMessagesByLocale(EMessage.TextCheckNumberErrorNotice, lang);
      case ETextType.EnglishOnly:
        return locale.getMessagesByLocale(EMessage.TextCheckEnglishErrorNotice, lang);
      case ETextType.CustomFormat:
        return locale.getMessagesByLocale(EMessage.TextCheckCustomErrorNotice, lang);
      default:
        return '';
    }
  }

  public static textAttributeValidate(textCheckType: number, customFormat: string, text: string) {
    try {
      const reg = new RegExp(this.checkString(textCheckType, customFormat));
      return reg.test(text);
    } catch (error) {
      // message.error('正则填写错误');
    }
  }

  /**
   * 检查结果的文本标注数据是否可以通过
   * @param textCheckType
   * @param customFormat
   * @param resultList 需要检查的结果集
   */
  public static checkTextAttribute(
    textCheckType: ETextType,
    customFormat: string,
    resultList: any[],
    selectedID?: string,
  ): boolean {
    let error = false;
    resultList.forEach((item) => {
      if (item?.textAttribute === undefined || item?.textAttribute === '') {
        return;
      }
      if (
        (selectedID ? item.id === selectedID : true) &&
        !this.textAttributeValidate(textCheckType, customFormat, item.textAttribute)
      ) {
        error = true;
      }
    });
    if (error) {
      // message.error(getErrorNotice(textCheckType));
      return true;
    }
    return false;
  }

  /**
   * 改变文本标注后 修改全部的LOG
   * @param toolLog LOG数据
   * @param toolList 工具的数据集
   */
  public static changeTextAttributeInLog(toolLog: any[][], toolList: any[]) {
    return toolLog?.map((item) => {
      return item?.map((info) => {
        if (toolList?.findIndex((i) => i?.id === info?.id) > -1) {
          const changeRect = toolList?.find((i) => i?.id === info?.id);
          return {
            ...info,
            textAttribute: changeRect?.textAttribute,
          };
        }
        return info;
      });
    });
  }

  public static getTextIconSvg(
    attribute = '',
    attributeList: IInputList[],
    attributeConfigurable = false,
    baseIcon: any,
  ) {
    if (attributeConfigurable === true) {
      // Open attribute configuration
      const attributeIndex = (attributeList?.findIndex((i: any) => i?.value === attribute) % COLORS_ARRAY.length) + 1;
      const color = attributeList?.find((i: any) => i.value === attribute)?.color;
      if (color) {
        const getHexColor = ToolStyleUtils.rgbaStringToHex(color);
        return this.generateIconAttribute({ fill: getHexColor });
      }
      return ICON_ARRAY[attributeIndex];
    }

    return baseIcon;
  }

  public static generateIconAttribute({
    fill,
    width = 16,
    height = 16,
    xmlns = 'http://www.w3.org/2000/svg',
    xlink = 'http://www.w3.org/1999/xlink',
  }: {
    fill?: string;
    width?: number;
    height?: number;
    xmlns?: string;
    xlink?: string;
  }) {
    return `<span style={color:${fill}}><svg xmlns=${xmlns} xmlns:xlink=${xlink} width=${width} height=${height} viewBox="0 0 16 16"><defs><clipPath id="a"><path d="M0,0H16V-16H0Z" fill="none"/></clipPath><clipPath id="b"><path d="M13.75-2.937H2.25a.5.5,0,0,0-.5.5v.563a.125.125,0,0,0,.125.125h12.25a.125.125,0,0,0,.125-.125v-.562A.5.5,0,0,0,13.75-2.937ZM4.027-4.25a.632.632,0,0,0,.094-.008l2.628-.461a.153.153,0,0,0,.083-.044l6.623-6.623a.156.156,0,0,0,0-.22l-2.6-2.6a.155.155,0,0,0-.111-.045.155.155,0,0,0-.111.045L4.012-7.581a.159.159,0,0,0-.044.083L3.508-4.87a.524.524,0,0,0,.147.466.529.529,0,0,0,.372.155Z" fill="none"/></clipPath></defs><g transform="translate(0 16)"><g clip-path="url(#a)"><path d="M-5-21H21V5H-5Z" fill="rgba(0,0,0,0)"/></g><g clip-path="url(#b)"><path d="M-3.25-19.25h22.5V3.25H-3.25Z" fill='currentColor'/></g></g></svg></span>`;
  }

  /**
   * 根据keycode返回attribute, 没有匹配到时为undefined
   * @param keyCode
   * @param attributeList
   * @returns {undefined|string} 没有匹配到时为undefined
   */
  public static getAttributeByKeycode(keyCode: number, attributeList: IInputList[]) {
    let num;
    if (MathUtils.isInRange(keyCode, [48, 57])) {
      num = keyCode - 48;
    }

    if (MathUtils.isInRange(keyCode, [96, 105])) {
      num = keyCode - 96;
    }

    if (num === 0) {
      return '';
    }

    return num ? attributeList[num - 1]?.value : undefined;
  }
}
