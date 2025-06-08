import { Injectable } from '@nestjs/common';
import { JiJinEntity } from './stock.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Cacheable } from '../common/methodCache';

// 基金API配置
const fundHeaders = {
  validmark:
    'aKVEnBbJF9Nip2Wjf4de/fSvA8W3X3iB4L6vT0Y5cxvZbEfEm17udZKUD2qy37dLRY3bzzHLDv+up/Yn3OTo5Q==',
};

const deviceId = '874C427C-7C24-4980-A835-66FD40B67605';
const version = '6.5.5';
const baseData = {
  product: 'EFund',
  deviceid: deviceId,
  MobileKey: deviceId,
  plat: 'Iphone',
  PhoneType: 'IOS15.1.0',
  OSVersion: '15.5',
  version,
  ServerVersion: version,
  Version: version,
  appVersion: version,
};

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(JiJinEntity)
    private readonly jijiRepository: Repository<JiJinEntity>,
  ) { }

  // 获取基金列表
  @Cacheable(60 * 60 * 24)
  getFundList = async (page: number = 1, pageSize: number = 10) => {
    const codes = [
      '000043',
      '004243',
      '007721',
      '012752',
      '014002',
      '017437',
      '017641',
      '017731',
      '040046',
      '050025',
      '100055',
      '162415',
      '162719',
      '270023',
    ];
    const skip = (page - 1) * pageSize;
    const funds = await Promise.all(
      codes.slice(skip, skip + pageSize).map(this.fetchFundPerformanceForList),
    );

    return {
      data: funds,
      total: codes.length,
      page,
      pageSize,
      totalPages: Math.ceil(codes.length / pageSize),
    };
  };

  fetchFundPerformanceForList = async (fundCode: string) => {
    try {
      const params = new URLSearchParams({
        ...baseData,
        FCODE: fundCode,
      });

      const response = await fetch(
        `https://fundmobapi.eastmoney.com/FundMNewApi/FundMNPeriodIncrease?${params.toString()}`,
        {
          headers: fundHeaders,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const Datas = data.Datas;
      const yield1N = Datas.find((item: any) => item.title === '1N');
      const yieldJN = Datas.find((item: any) => item.title === 'JN');
      const { name, type } = await this.fetchFundBasicInfo(fundCode);
      return {
        code: fundCode,
        name: name,
        type: type,
        yield1N: yield1N.syl,
        yieldY: yieldJN.syl,
      };
    } catch (error) {
      console.error('Error fetching fund performance:', error);
      throw new Error(
        'Failed to fetch fund performance. Please check the fund code and try again.',
      );
    }
  };

  // 获取基金收益率数据
  fetchFundPerformance = async (fundCode: string) => {
    try {
      const params = new URLSearchParams({
        ...baseData,
        FCODE: fundCode,
      });

      const response = await fetch(
        `https://fundmobapi.eastmoney.com/FundMNewApi/FundMNPeriodIncrease?${params.toString()}`,
        {
          headers: fundHeaders,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching fund performance:', error);
      throw new Error(
        'Failed to fetch fund performance. Please check the fund code and try again.',
      );
    }
  };

  // 获取基金基础信息
  fetchFundBasicInfo = async (fundCode: string) => {
    try {
      const params = new URLSearchParams({
        ...baseData,
        FCODE: fundCode,
      });

      const response = await fetch(
        `https://fundmobapi.eastmoney.com/FundMNewApi/FundMNStopWatch?${params.toString()}`,
        {
          headers: fundHeaders,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const Datas = data.Datas;
      const name = Datas.SHORTNAME;
      const type = Datas.FTYPE;
      return { name, type };
    } catch (error) {
      console.error('Error fetching fund basic info:', error);
      throw new Error(
        'Failed to fetch fund basic info. Please check the fund code and try again.',
      );
    }
  };
}
