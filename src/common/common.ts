import { ApiProperty } from '@nestjs/swagger';

export class PortResultType<T> {
  @ApiProperty({
    description: '请求状态， fail表示参数不正确或者其他错误，error表示服务端错误，success表示成功'
  })
  status: 'fail' | 'error' | 'success';
  @ApiProperty({
    description: '请求结果说明'
  })
  message: string;
  @ApiProperty({
    description: '请求结果状态码，400表示参数不正确或者其他错误， 500表示服务端错误，200表示成功'
  })
  statusCode: number;
  @ApiProperty({
    description: '返回的数据内容'
  })
  data?: T;
}