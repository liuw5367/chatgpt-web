import { IconRobot } from '@tabler/icons-react';

import { APP_NAME } from '../constants';

export function Logo() {
  return (
    <>
      <IconRobot size="2rem" stroke={1.5} className="fill-teal-600" />
      <div className="font-bold tracking-wider">{APP_NAME}</div>
    </>
  );
}
