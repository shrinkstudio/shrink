import { extractCommaSeparatedValues } from '@finsweet/attributes-utils';

import type { FieldValue, FiltersCondition, FiltersGroup, FilterTaskData } from './types';
import { areEqual, numericCompare, parseFilterValue } from './utils';

type ValidFiltersGroup = FiltersGroup & {
  validConditions: FiltersCondition[];
};

self.onmessage = (e: MessageEvent<FilterTaskData>) => {
  const { filters, items } = e.data;

  // Filter out invalid conditions (e.g. empty values) and groups (e.g. no valid conditions)
  const validGroups = filters.groups.reduce<ValidFiltersGroup[]>((validGroups, group) => {
    const validConditions = group.conditions.reduce<FiltersCondition[]>((validConditions, condition) => {
      const { op, value, fieldKey } = condition;
      if (!fieldKey) return validConditions;
      if (!op) return validConditions;

      if (op !== 'empty' && op !== 'not-empty') {
        const valueIsEmpty = value === '' || (Array.isArray(value) && !value.length);
        if (valueIsEmpty) return validConditions;
      }

      validConditions.push(condition);

      return validConditions;
    }, []);

    if (validConditions.length) {
      validGroups.push({ ...group, validConditions });
    }

    return validGroups;
  }, []);

  // Filter the items based on the valid groups and conditions
  const filteredItems = items.filter((item) => {
    const groupsPredicate = (groupData: ValidFiltersGroup) => {
      const conditionsPredicate = (condition: FiltersCondition) => {
        const fieldsPredicate = (fieldKey: string) => {
          const { op, filterMatch, fieldMatch } = condition;

          const fieldData = item.fields[fieldKey];
          if (!fieldData) return false;

          const fieldValue = fieldData.value;
          const filterValue = condition.value;

          if (op === 'empty') {
            return Array.isArray(fieldValue) ? !fieldValue.length : !fieldValue;
          }

          if (op === 'not-empty') {
            return Array.isArray(fieldValue) ? !!fieldValue.length : !!fieldValue;
          }

          const isNegative = op?.startsWith('not-');

          const compare = (fieldValue: FieldValue, filterValue: string, parsedFilterValue: FieldValue) => {
            let match = false;

            if (op === 'equal' || op === 'not-equal') {
              match = areEqual(fieldValue, parsedFilterValue, condition.fuzzyThreshold);
            } else if (op === 'start' || op === 'not-start') {
              match = fieldValue.toString().toLowerCase().startsWith(filterValue.toLowerCase());
            } else if (op === 'end' || op === 'not-end') {
              match = fieldValue.toString().toLowerCase().endsWith(filterValue.toLowerCase());
            } else if (op === 'contain' || op === 'not-contain') {
              match = fieldValue.toString().toLowerCase().includes(filterValue.toLowerCase());
            } else if (op === 'greater' || op === 'greater-equal' || op === 'less' || op === 'less-equal') {
              match = numericCompare(fieldValue, parsedFilterValue, op);
            }

            if (match && (op === 'equal' || op === 'contain')) {
              item.matchedFields[fieldKey] ||= [];
              item.matchedFields[fieldKey].push({ fieldValue, filterValue });
            }

            return isNegative ? !match : match;
          };

          const filterValueIsArray = Array.isArray(filterValue);
          const fieldValueIsArray = Array.isArray(fieldValue);

          const emptyFieldValue = fieldValue === '' || (fieldValueIsArray && !fieldValue.length);
          if (emptyFieldValue) return isNegative;

          // Both are arrays
          if (filterValueIsArray && fieldValueIsArray) {
            const predicate = (filterValue: string) => {
              const parsedFilterValue = parseFilterValue(filterValue, condition.type, fieldData.type);
              if (parsedFilterValue === null) return false;

              return fieldMatch === 'and'
                ? fieldValue.every((fieldValue) => compare(fieldValue, filterValue, parsedFilterValue))
                : fieldValue.some((fieldValue) => compare(fieldValue, filterValue, parsedFilterValue));
            };

            return filterMatch === 'and' ? filterValue.every(predicate) : filterValue.some(predicate);
          }

          // Filter is array, field is single
          if (filterValueIsArray && !fieldValueIsArray) {
            const predicate = (filterValue: string) => {
              const parsedFilterValue = parseFilterValue(filterValue, condition.type, fieldData.type);
              if (parsedFilterValue === null) return false;

              return compare(fieldValue, filterValue, parsedFilterValue);
            };

            return filterMatch === 'and' ? filterValue.every(predicate) : filterValue.some(predicate);
          }

          // Filter is single, field is array
          if (!filterValueIsArray && fieldValueIsArray) {
            const parsedFilterValue = parseFilterValue(filterValue, condition.type, fieldData.type);
            if (parsedFilterValue === null) return false;

            return fieldMatch === 'and'
              ? fieldValue.every((fieldValue) => compare(fieldValue, filterValue, parsedFilterValue))
              : fieldValue.some((fieldValue) => compare(fieldValue, filterValue, parsedFilterValue));
          }

          // Filter is single, field is single
          if (!filterValueIsArray && !fieldValueIsArray) {
            const parsedFilterValue = parseFilterValue(filterValue, condition.type, fieldData.type);
            if (parsedFilterValue === null) return false;

            return compare(fieldValue, filterValue, parsedFilterValue);
          }

          // If we reach this point, the filter value is not valid
          return false;
        };

        const fieldKeys =
          condition.fieldKey === '*' ? Object.keys(item.fields) : extractCommaSeparatedValues(condition.fieldKey);

        return condition.fieldMatch === 'and' ? fieldKeys.every(fieldsPredicate) : fieldKeys.some(fieldsPredicate);
      };

      return groupData.conditionsMatch === 'or'
        ? groupData.validConditions.some(conditionsPredicate)
        : groupData.validConditions.every(conditionsPredicate);
    };

    return filters.groupsMatch === 'or' ? validGroups.some(groupsPredicate) : validGroups.every(groupsPredicate);
  });

  self.postMessage(filteredItems);
};
