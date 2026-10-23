export type GuideStepCompletion = {
  income: boolean;
  expense: boolean;
  generate: boolean;
  pay: boolean;
};
export type GuideData = {
  stepsCompletion: GuideStepCompletion;
  isVisible: boolean;
  isCompleted: boolean;
};
