export interface LangString {
  'xsd:string'?: string;
  'rdf:langString'?: {
    de?: string[];
    fr?: string[];
    it?: string[];
    rm?: string[];
    en?: string[];
  };
}

export interface LawExpression {
  uri: string;
  type: string;
  attributes?: {
    title?: LangString;
    titleShort?: LangString;
  };
  references?: {
    language: string;
  };
}

export interface LawDocument {
  data: {
    uri: string;
    type: string[];
    attributes: {
      dateDocument?: {
        'xsd:date': string;
      };
      dateEntryInForce?: {
        'xsd:date': string;
      };
      dateNoLongerInForce?: {
        'xsd:date': string;
      };
      basicAct?: {
        'rdfs:Resource': string;
      };
      typeDocument?: {
        'rdfs:Resource': string;
      };
    };
    references: {
      isRealizedBy?: string[];
      inForceStatus?: string;
      classifiedByTaxonomyEntry?: string;
    };
  };
  included?: LawExpression[];
} 