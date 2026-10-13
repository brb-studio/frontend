const ADMIN_PATH =
  /^(tenant|branches|barbers|services|packages|promotions|users|time-off|appointments|availability|products)(\/[a-f\d]{24})?$|^appointments\/my-day$|^payments(\/settings|\/deposit|\/stripe(\/onboarding|\/refresh|\/dashboard)?|\/appointments\/[a-f\d]{24}\/refund|\/[a-f\d]{24}\/(confirm|reject))?$|^product-orders(\/scan|\/[a-f\d]{24}\/(deliver|cancel))?$|^earnings(\/appointments|\/payouts|\/barbers\/[a-f\d]{24})?$/;

export const isAdminPath = (path: string) => ADMIN_PATH.test(path);
