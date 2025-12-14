import type { Schema, Struct } from '@strapi/strapi';

export interface CustomContactInfo extends Struct.ComponentSchema {
  collectionName: 'components_custom_contact_infos';
  info: {
    displayName: 'ContactInfo';
    icon: 'phone';
  };
  attributes: {
    Email: Schema.Attribute.Email;
    Facebook: Schema.Attribute.String;
    Instagram: Schema.Attribute.String;
    PhoneNumber1: Schema.Attribute.String;
    PhoneNumber2: Schema.Attribute.String;
    TwitterOrX: Schema.Attribute.String;
    Website: Schema.Attribute.String;
    WhatsAppNumber: Schema.Attribute.String;
  };
}

export interface CustomDayRangeOcTimes extends Struct.ComponentSchema {
  collectionName: 'components_custom_day_range_oc_times';
  info: {
    displayName: 'DayRangeOCTimes';
    icon: 'clock';
  };
  attributes: {
    Close2: Schema.Attribute.Time;
    ClosesMidday: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    CloseTime1: Schema.Attribute.Time;
    Open2: Schema.Attribute.Time;
    OpenTime1: Schema.Attribute.Time;
  };
}

export interface CustomEventCategories extends Struct.ComponentSchema {
  collectionName: 'components_custom_event_categories';
  info: {
    displayName: 'EventCategories';
    icon: 'calendar';
  };
  attributes: {
    Category: Schema.Attribute.Enumeration<
      ['Religion/Spirituality\t', 'Sports', 'Market', 'Music', 'Culture']
    >;
  };
}

export interface CustomFiltersTemplate extends Struct.ComponentSchema {
  collectionName: 'components_custom_filters_templates';
  info: {
    displayName: 'FiltersTemplate';
    icon: 'filter';
  };
  attributes: {
    AltSlug_AllTrue: Schema.Attribute.String;
    FilterName: Schema.Attribute.String & Schema.Attribute.Required;
    FilterTooltip: Schema.Attribute.Text;
    FilterType: Schema.Attribute.Enumeration<
      ['SingleChoice', 'MultipleChoices', 'Number_Int', 'Other']
    > &
      Schema.Attribute.Required;
    MultipleChoiceOptions: Schema.Attribute.Component<
      'custom.text-options',
      true
    >;
    Number_Int_Params: Schema.Attribute.Component<
      'custom.number-filter-template-int',
      false
    >;
    ShowInFilterMenu: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    SingleChoiceOptions: Schema.Attribute.Component<
      'custom.text-options',
      true
    >;
    Slug: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface CustomGastronomy extends Struct.ComponentSchema {
  collectionName: 'components_custom_gastronomies';
  info: {
    displayName: 'Gastronomy';
    icon: 'restaurant';
  };
  attributes: {
    Costarican: Schema.Attribute.Boolean;
    French: Schema.Attribute.Boolean;
    GlutenFree: Schema.Attribute.Boolean;
    Indian: Schema.Attribute.Boolean;
    International: Schema.Attribute.Boolean;
    Italian: Schema.Attribute.Boolean;
    Lebanese: Schema.Attribute.Boolean;
    Mexican: Schema.Attribute.Boolean;
    Spanish: Schema.Attribute.Boolean;
    Vegan: Schema.Attribute.Boolean;
    Vegetarian: Schema.Attribute.Boolean;
  };
}

export interface CustomGeneralInformation extends Struct.ComponentSchema {
  collectionName: 'components_custom_general_informations';
  info: {
    displayName: 'GeneralInformation';
  };
  attributes: {
    ElectronicInvoicing: Schema.Attribute.Boolean;
    FoundingDate: Schema.Attribute.Date;
    LanguagesSpoken: Schema.Attribute.Component<
      'custom.languages-spoken',
      true
    >;
    OperatingHours: Schema.Attribute.Component<
      'custom.opening-and-closing-times',
      false
    >;
    paymentMethods: Schema.Attribute.Component<'custom.payment-methods', true>;
  };
}

export interface CustomLanguagesSpoken extends Struct.ComponentSchema {
  collectionName: 'components_custom_languages_spokens';
  info: {
    displayName: 'LanguagesSpoken';
  };
  attributes: {
    Languages: Schema.Attribute.Enumeration<
      ['Spanish', 'English', 'Italian', 'French', 'German']
    >;
  };
}

export interface CustomNumberFilterTemplateInt extends Struct.ComponentSchema {
  collectionName: 'components_custom_number_filter_template_ints';
  info: {
    displayName: 'NumberFilterTemplate_Int';
    icon: 'filter';
  };
  attributes: {
    Max: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1000>;
    Min: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
  };
}

export interface CustomOpeningAndClosingTimes extends Struct.ComponentSchema {
  collectionName: 'components_custom_opening_and_closing_times';
  info: {
    displayName: 'OpeningAndClosingTimes';
    icon: 'clock';
  };
  attributes: {
    ClosingTime: Schema.Attribute.Time;
    Day: Schema.Attribute.Enumeration<
      [
        'Mon - Sat',
        'Mon - Fri',
        'Sat - Sun',
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat',
        'Sun',
      ]
    > &
      Schema.Attribute.Required;
    IfClosed: Schema.Attribute.Enumeration<['Closed']>;
    OpeningTime: Schema.Attribute.Time;
  };
}

export interface CustomOpeningAndClosingTimesV2 extends Struct.ComponentSchema {
  collectionName: 'components_custom_opening_and_closing_times_v2s';
  info: {
    displayName: 'OpeningAndClosingTimesV2';
    icon: 'clock';
  };
  attributes: {
    DayRange: Schema.Attribute.Enumeration<
      [
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat',
        'Sun',
        'Mon-Fri',
        'Mon-Sat',
        'Mon-Sun',
        'Sat-Sun',
      ]
    >;
    DayRangeOCTimes: Schema.Attribute.Component<
      'custom.day-range-oc-times',
      false
    >;
    IsClosed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface CustomPaymentMethods extends Struct.ComponentSchema {
  collectionName: 'components_custom_payment_methods';
  info: {
    displayName: 'PaymentMethods_Tooltips';
  };
  attributes: {
    PaymentMethod: Schema.Attribute.Enumeration<
      [
        'Cash - USD',
        'Cash - CRC',
        'Credit Card',
        'Sinpe',
        'Electronic invoicing',
        'Normal Bill',
        'Complete invoice',
        'Simplified invoice',
      ]
    >;
    PaymentMethod_Tooltip: Schema.Attribute.Text;
  };
}

export interface CustomPaymentMethodsV2 extends Struct.ComponentSchema {
  collectionName: 'components_custom_payment_methods_v2s';
  info: {
    displayName: 'PaymentMethodsV2';
  };
  attributes: {
    CashCRC: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    CashUSD: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    CompleteInvoice: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    CreditCard: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    ElectronicInvoicing: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    NormalBill: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    SimplifiedInvoice: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    Sinpe: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface CustomTextOptions extends Struct.ComponentSchema {
  collectionName: 'components_custom_text_options';
  info: {
    displayName: 'TextOptions';
    icon: 'pencil';
  };
  attributes: {
    OptionMainText: Schema.Attribute.String & Schema.Attribute.Required;
    OptionTooltip: Schema.Attribute.Text;
    Slug: Schema.Attribute.String;
  };
}

export interface CustomTypeOfFood extends Struct.ComponentSchema {
  collectionName: 'components_custom_type_of_foods';
  info: {
    displayName: 'TypeOfFood';
    icon: 'restaurant';
  };
  attributes: {
    BBQ: Schema.Attribute.Boolean;
    Contemporary: Schema.Attribute.Boolean;
    FastFood: Schema.Attribute.Boolean;
    Fusion: Schema.Attribute.Boolean;
    Pizza: Schema.Attribute.Boolean;
    Seafood: Schema.Attribute.Boolean;
    Steakhouse: Schema.Attribute.Boolean;
    Sushi: Schema.Attribute.Boolean;
  };
}

export interface CustomTypeOfFoodV2 extends Struct.ComponentSchema {
  collectionName: 'components_custom_type_of_food_v2s';
  info: {
    displayName: 'TypeOfFood-V2';
    icon: 'restaurant';
  };
  attributes: {
    TypesOfFood: Schema.Attribute.Enumeration<
      [
        'Pizza',
        'Fast Food',
        'Sushi',
        'BBQ',
        'Fusion',
        'Contemporary',
        'Steakhouse',
        'Seafood',
      ]
    >;
  };
}

export interface FilterGroupsHotelFilters extends Struct.ComponentSchema {
  collectionName: 'components_filter_groups_hotel_filters';
  info: {
    displayName: 'HotelFilters';
    icon: 'house';
  };
  attributes: {
    AllPaymentMethodsAccepted: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    Contacts: Schema.Attribute.Component<'custom.contact-info', false>;
    FoundingDate: Schema.Attribute.Date;
    IsFilterLegend: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    Open247: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    OpeningAndClosingTimes: Schema.Attribute.Component<
      'custom.opening-and-closing-times-v2',
      true
    >;
    PaymentMethods: Schema.Attribute.Component<
      'custom.payment-methods-v2',
      false
    >;
    PaymentMethods_Tooltip: Schema.Attribute.Text;
    PaymentMethods_Tooltips: Schema.Attribute.Component<
      'custom.payment-methods',
      true
    >;
    PropertyOptions: Schema.Attribute.Component<
      'hotel-filters.property-options-v2',
      false
    >;
    PropertyOptions_Tooltip: Schema.Attribute.Text;
    PropertyOptions_Tooltips: Schema.Attribute.Component<
      'hotel-filters.property-options',
      true
    >;
  };
}

export interface FilterGroupsRestaurantFilters extends Struct.ComponentSchema {
  collectionName: 'components_filter_groups_restaurant_filters_s';
  info: {
    displayName: 'RestaurantFilters ';
    icon: 'puzzle';
  };
  attributes: {
    Gastronomy: Schema.Attribute.Component<
      'restaurant-filters.gastronomy',
      true
    >;
  };
}

export interface HotelFiltersPropertyOptions extends Struct.ComponentSchema {
  collectionName: 'components_hotel_filters_property_options';
  info: {
    displayName: 'PropertyOptions_Tooltips';
    icon: 'house';
  };
  attributes: {
    PropertyOption_Tooltip: Schema.Attribute.Text;
    PropertyOptions: Schema.Attribute.Enumeration<
      [
        'Parking on the Road',
        'Private Parking',
        'Wheelchair access',
        'A/C',
        'Wifi',
        'All inclusive',
        'Breakfast include',
        'Adultos only',
        'Family environment',
        'Pets allowed',
      ]
    >;
  };
}

export interface HotelFiltersPropertyOptionsV2 extends Struct.ComponentSchema {
  collectionName: 'components_hotel_filters_property_options_v2s';
  info: {
    displayName: 'PropertyOptionsV2';
    icon: 'house';
  };
  attributes: {
    AC: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    AdultsOnly: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    AllInclusive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    BreakfastIncluded: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    FamilyEnvironment: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    ParkingOnTheRoad: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    PetsAllowed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    PrivateParking: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    WheelchairAccess: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    WiFi: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface RestaurantFiltersGastronomy extends Struct.ComponentSchema {
  collectionName: 'components_restaurant_filters_gastronomies';
  info: {
    displayName: 'Gastronomy';
    icon: 'restaurant';
  };
  attributes: {
    GastronomyOption: Schema.Attribute.Enumeration<
      [
        'Vegan',
        'Vegetarian',
        'International (different types of food)',
        'Costarican',
        'Lebanese',
        'Spanish',
        'Italian',
        'French',
        'Mexican',
        'Indian',
        'Chinese',
        'Venezuelan',
        'Gluten Free',
      ]
    >;
  };
}

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
    icon: 'indent';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    description: '';
    displayName: 'Slider';
    icon: 'address-book';
  };
  attributes: {
    files: Schema.Attribute.Media<'images', true>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'custom.contact-info': CustomContactInfo;
      'custom.day-range-oc-times': CustomDayRangeOcTimes;
      'custom.event-categories': CustomEventCategories;
      'custom.filters-template': CustomFiltersTemplate;
      'custom.gastronomy': CustomGastronomy;
      'custom.general-information': CustomGeneralInformation;
      'custom.languages-spoken': CustomLanguagesSpoken;
      'custom.number-filter-template-int': CustomNumberFilterTemplateInt;
      'custom.opening-and-closing-times': CustomOpeningAndClosingTimes;
      'custom.opening-and-closing-times-v2': CustomOpeningAndClosingTimesV2;
      'custom.payment-methods': CustomPaymentMethods;
      'custom.payment-methods-v2': CustomPaymentMethodsV2;
      'custom.text-options': CustomTextOptions;
      'custom.type-of-food': CustomTypeOfFood;
      'custom.type-of-food-v2': CustomTypeOfFoodV2;
      'filter-groups.hotel-filters': FilterGroupsHotelFilters;
      'filter-groups.restaurant-filters': FilterGroupsRestaurantFilters;
      'hotel-filters.property-options': HotelFiltersPropertyOptions;
      'hotel-filters.property-options-v2': HotelFiltersPropertyOptionsV2;
      'restaurant-filters.gastronomy': RestaurantFiltersGastronomy;
      'shared.media': SharedMedia;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
    }
  }
}
