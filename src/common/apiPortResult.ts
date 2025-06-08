import { applyDecorators, Type } from '@nestjs/common';
import { ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PortResultType } from './common';

export const ApiPortResult = <TModel extends Type<unknown>>(model?: TModel) => {
  const allOf: any = [{ $ref: getSchemaPath(PortResultType) }];
  if (model) {
    allOf.push({
      properties: {
        data: {
          allOf: [{ $ref: getSchemaPath(model) }],
        },
      },
    });
  }
  return applyDecorators(
    ApiOkResponse({
      schema: { allOf },
    }),
  );
};
