/**
 * Get section template by ID
 */
export function getSectionTemplate(id: any): {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            logo: string;
            sticky: string;
        };
        container: boolean;
        children: {
            n: string;
            t: string;
            d: {
                class: string;
            };
            container: boolean;
            children: {
                n: string;
                t: string;
                d: {
                    text: string;
                    href: string;
                    class: string;
                };
            }[];
        }[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            variant: string;
            title: string;
            subtitle: string;
            cta: string;
            ctaHref: string;
            height: string;
            align: string;
            overlay: boolean;
        };
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
            maxWidth: string;
            margin: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    subtitle: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    subtitle: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    subtitle: string;
                    image: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    name: string;
                    role: string;
                    avatar: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    quote: string;
                    author: string;
                    role: string;
                    rating: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: ({
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    plan: string;
                    price: string;
                    period: string;
                    features: string;
                    cta: string;
                    featured?: undefined;
                };
            } | {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    plan: string;
                    price: string;
                    period: string;
                    features: string;
                    cta: string;
                    featured: string;
                };
            })[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
            maxWidth: string;
            margin: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                direction?: undefined;
                gap?: undefined;
                width?: undefined;
            };
            b?: undefined;
            container?: undefined;
            children?: undefined;
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                width: string;
                text?: undefined;
            };
            container: boolean;
            children: {
                n: string;
                b: string;
                t: string;
                d: {
                    summary: string;
                };
                children: {
                    t: string;
                    text: string;
                }[];
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
                maxWidth?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                maxWidth: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: ({
                n: string;
                b: string;
                t: string;
                d: {
                    direction: string;
                    gap: string;
                    title?: undefined;
                };
                container: boolean;
                children: {
                    n: string;
                    i: string;
                    b: string;
                    t: string;
                    d: {
                        title: string;
                        subtitle: string;
                    };
                }[];
            } | {
                n: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    direction?: undefined;
                    gap?: undefined;
                };
                container: boolean;
                children: ({
                    n: string;
                    t: string;
                    d: {
                        type: string;
                        placeholder: string;
                        rows?: undefined;
                        text?: undefined;
                        class?: undefined;
                    };
                } | {
                    n: string;
                    t: string;
                    d: {
                        placeholder: string;
                        rows: string;
                        type?: undefined;
                        text?: undefined;
                        class?: undefined;
                    };
                } | {
                    n: string;
                    t: string;
                    d: {
                        text: string;
                        class: string;
                        type?: undefined;
                        placeholder?: undefined;
                        rows?: undefined;
                    };
                })[];
            })[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
        };
        container: boolean;
        children: ({
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
                style?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                b: string;
                t: string;
                d: {
                    direction: string;
                    gap: string;
                };
                container: boolean;
                children: ({
                    n: string;
                    t: string;
                    d: {
                        text: string;
                        href?: undefined;
                    };
                } | {
                    n: string;
                    t: string;
                    d: {
                        text: string;
                        href: string;
                    };
                })[];
            }[];
        } | {
            n: string;
            t: string;
            d: {
                text: string;
                style: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            variant: string;
            title: string;
            subtitle: string;
            cta: string;
            ctaHref: string;
            height: string;
            align: string;
            overlay: boolean;
        };
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    subtitle: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
            maxWidth: string;
            margin: string;
        };
        container: boolean;
        children: {
            n: string;
            t: string;
            d: {
                text: string;
            };
        }[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            align: string;
            padding: string;
        };
        container: boolean;
        children: ({
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                src?: undefined;
                alt?: undefined;
            };
            container: boolean;
            children: ({
                n: string;
                t: string;
                d: {
                    text: string;
                    class?: undefined;
                };
            } | {
                n: string;
                t: string;
                d: {
                    text: string;
                    class: string;
                };
            })[];
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                src: string;
                alt: string;
                direction?: undefined;
                gap?: undefined;
            };
            container?: undefined;
            children?: undefined;
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
            justify: string;
        };
        container: boolean;
        children: ({
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                width: string;
                title?: undefined;
                subtitle?: undefined;
            };
            container: boolean;
            children: {
                n: string;
                t: string;
                d: {
                    text: string;
                };
            }[];
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                title: string;
                subtitle: string;
                direction?: undefined;
                gap?: undefined;
                width?: undefined;
            };
            container: boolean;
            children: ({
                n: string;
                t: string;
                d: {
                    type: string;
                    placeholder: string;
                    text?: undefined;
                    class?: undefined;
                };
            } | {
                n: string;
                t: string;
                d: {
                    text: string;
                    class: string;
                    type?: undefined;
                    placeholder?: undefined;
                };
            })[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                items?: undefined;
            };
            b?: undefined;
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                items: string;
                text?: undefined;
            };
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
        };
        container: boolean;
        children: {
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                align: string;
            };
            container: boolean;
            children: ({
                n: string;
                b: string;
                t: string;
                d: {
                    direction: string;
                    gap: string;
                    width: string;
                    src?: undefined;
                    alt?: undefined;
                };
                container: boolean;
                children: {
                    n: string;
                    t: string;
                    d: {
                        text: string;
                    };
                }[];
            } | {
                n: string;
                b: string;
                t: string;
                d: {
                    src: string;
                    alt: string;
                    direction?: undefined;
                    gap?: undefined;
                    width?: undefined;
                };
                container?: undefined;
                children?: undefined;
            })[];
        }[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: ({
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    plan: string;
                    price: string;
                    period: string;
                    features: string;
                    cta: string;
                    featured?: undefined;
                };
            } | {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    plan: string;
                    price: string;
                    period: string;
                    features: string;
                    cta: string;
                    featured: string;
                };
            })[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    name: string;
                    role: string;
                    avatar: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    quote: string;
                    author: string;
                    role: string;
                    rating: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
            };
            container: boolean;
            gridChildren: ({
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    value: string;
                    label: string;
                    icon: string;
                    trend: string;
                    trendValue: string;
                };
            } | {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    value: string;
                    label: string;
                    icon: string;
                    trend?: undefined;
                    trendValue?: undefined;
                };
            })[];
        }[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                direction?: undefined;
                gap?: undefined;
            };
            b?: undefined;
            container?: undefined;
            children?: undefined;
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            children: {
                n: string;
                b: string;
                t: string;
                d: {
                    summary: string;
                };
                children: {
                    t: string;
                    text: string;
                }[];
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
            justify: string;
            background: string;
        };
        container: boolean;
        children: ({
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                width: string;
                src?: undefined;
                alt?: undefined;
                style?: undefined;
            };
            container: boolean;
            children: ({
                n: string;
                t: string;
                d: {
                    text: string;
                    direction?: undefined;
                    gap?: undefined;
                };
                b?: undefined;
                container?: undefined;
                children?: undefined;
            } | {
                n: string;
                b: string;
                t: string;
                d: {
                    direction: string;
                    gap: string;
                    text?: undefined;
                };
                container: boolean;
                children: {
                    n: string;
                    t: string;
                    d: {
                        text: string;
                        class: string;
                    };
                }[];
            })[];
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                src: string;
                alt: string;
                style: string;
                direction?: undefined;
                gap?: undefined;
                width?: undefined;
            };
            container?: undefined;
            children?: undefined;
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            variant: string;
            title: string;
            subtitle: string;
            cta: string;
            ctaHref: string;
            height: string;
            align: string;
            overlay: boolean;
            backgroundImage: string;
        };
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    description: string;
                    price: string;
                    image: string;
                    cta: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
        };
        container: boolean;
        children: {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: number;
                gap: string;
            };
            container: boolean;
            children: {
                n: string;
                b: string;
                t: string;
                d: {
                    src: string;
                    alt: string;
                };
            }[];
        }[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: ({
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    price: string;
                    image: string;
                    badge: string;
                };
            } | {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    price: string;
                    image: string;
                    badge?: undefined;
                };
            })[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                style: string;
                class?: undefined;
            };
        } | {
            n: string;
            t: string;
            d: {
                text: string;
                style?: undefined;
                class?: undefined;
            };
        } | {
            n: string;
            t: string;
            d: {
                text: string;
                class: string;
                style?: undefined;
            };
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
            minHeight: string;
            justify: string;
        };
        container: boolean;
        children: {
            n: string;
            b: string;
            t: string;
            d: {
                title: string;
                subtitle: string;
                style: string;
            };
            container: boolean;
            children: ({
                n: string;
                t: string;
                d: {
                    type: string;
                    placeholder: string;
                    direction?: undefined;
                    justify?: undefined;
                    width?: undefined;
                    text?: undefined;
                    class?: undefined;
                };
                b?: undefined;
                container?: undefined;
                children?: undefined;
            } | {
                n: string;
                b: string;
                t: string;
                d: {
                    direction: string;
                    justify: string;
                    width: string;
                    type?: undefined;
                    placeholder?: undefined;
                    text?: undefined;
                    class?: undefined;
                };
                container: boolean;
                children: ({
                    n: string;
                    t: string;
                    d: {
                        type: string;
                        label: string;
                        text?: undefined;
                        href?: undefined;
                    };
                } | {
                    n: string;
                    t: string;
                    d: {
                        text: string;
                        href: string;
                        type?: undefined;
                        label?: undefined;
                    };
                })[];
            } | {
                n: string;
                t: string;
                d: {
                    text: string;
                    class: string;
                    type?: undefined;
                    placeholder?: undefined;
                    direction?: undefined;
                    justify?: undefined;
                    width?: undefined;
                };
                b?: undefined;
                container?: undefined;
                children?: undefined;
            })[];
        }[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            justify: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                direction?: undefined;
                gap?: undefined;
            };
            b?: undefined;
            container?: undefined;
            children?: undefined;
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            children: {
                n: string;
                t: string;
                d: {
                    text: string;
                    href: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
        };
        container: boolean;
        children: ({
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                b: string;
                t: string;
                d: {
                    direction: string;
                    gap: string;
                };
                container: boolean;
                children: ({
                    n: string;
                    t: string;
                    d: {
                        text: string;
                        href?: undefined;
                    };
                } | {
                    n: string;
                    t: string;
                    d: {
                        text: string;
                        href: string;
                    };
                })[];
            }[];
        } | {
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                b: string;
                t: string;
                d: {
                    src: string;
                    alt: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    subtitle: string;
                    image: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            maxWidth: string;
            margin: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                src?: undefined;
                alt?: undefined;
            };
            b?: undefined;
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                src: string;
                alt: string;
                text?: undefined;
            };
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                direction?: undefined;
                gap?: undefined;
                justify?: undefined;
            };
            b?: undefined;
            container?: undefined;
            children?: undefined;
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                justify: string;
                text?: undefined;
            };
            container: boolean;
            children: ({
                n: string;
                i: string;
                t: string;
                d: {
                    type: string;
                    placeholder: string;
                    text?: undefined;
                    class?: undefined;
                };
            } | {
                n: string;
                t: string;
                d: {
                    text: string;
                    class: string;
                    type?: undefined;
                    placeholder?: undefined;
                };
                i?: undefined;
            })[];
        })[];
    }[];
};
/**
 * Get page template by ID
 */
export function getPageTemplate(id: any): {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    preview: string;
    sections: string[];
};
/**
 * Expand page template to full component list
 */
export function expandPageTemplate(pageTemplate: any): ({
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        logo: string;
        sticky: string;
    };
    container: boolean;
    children: {
        n: string;
        t: string;
        d: {
            class: string;
        };
        container: boolean;
        children: {
            n: string;
            t: string;
            d: {
                text: string;
                href: string;
                class: string;
            };
        }[];
    }[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        id: string;
        direction: string;
        gap: string;
        padding: string;
        align: string;
    };
    container: boolean;
    children: ({
        n: string;
        t: string;
        d: {
            text: string;
            columns?: undefined;
            gap?: undefined;
            maxWidth?: undefined;
        };
        i?: undefined;
        b?: undefined;
        container?: undefined;
        gridChildren?: undefined;
    } | {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            columns: string;
            gap: string;
            maxWidth: string;
            text?: undefined;
        };
        container: boolean;
        gridChildren: ({
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                title?: undefined;
            };
            container: boolean;
            children: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    subtitle: string;
                };
            }[];
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                title: string;
                direction?: undefined;
                gap?: undefined;
            };
            container: boolean;
            children: ({
                n: string;
                t: string;
                d: {
                    type: string;
                    placeholder: string;
                    rows?: undefined;
                    text?: undefined;
                    class?: undefined;
                };
            } | {
                n: string;
                t: string;
                d: {
                    placeholder: string;
                    rows: string;
                    type?: undefined;
                    text?: undefined;
                    class?: undefined;
                };
            } | {
                n: string;
                t: string;
                d: {
                    text: string;
                    class: string;
                    type?: undefined;
                    placeholder?: undefined;
                    rows?: undefined;
                };
            })[];
        })[];
    })[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        variant: string;
        title: string;
        subtitle: string;
        cta: string;
        ctaHref: string;
        height: string;
        align: string;
        overlay: boolean;
    };
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        padding: string;
        align: string;
    };
    container: boolean;
    children: ({
        n: string;
        t: string;
        d: {
            text: string;
            columns?: undefined;
        };
        i?: undefined;
        b?: undefined;
        container?: undefined;
        gridChildren?: undefined;
    } | {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            columns: string;
            text?: undefined;
        };
        container: boolean;
        gridChildren: {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                title: string;
                subtitle: string;
            };
        }[];
    })[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        padding: string;
        align: string;
        maxWidth: string;
        margin: string;
    };
    container: boolean;
    children: {
        n: string;
        t: string;
        d: {
            text: string;
        };
    }[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        align: string;
        padding: string;
    };
    container: boolean;
    children: ({
        n: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            src?: undefined;
            alt?: undefined;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                class?: undefined;
            };
        } | {
            n: string;
            t: string;
            d: {
                text: string;
                class: string;
            };
        })[];
    } | {
        n: string;
        b: string;
        t: string;
        d: {
            src: string;
            alt: string;
            direction?: undefined;
            gap?: undefined;
        };
        container?: undefined;
        children?: undefined;
    })[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        padding: string;
        align: string;
        justify: string;
    };
    container: boolean;
    children: ({
        n: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            width: string;
            title?: undefined;
            subtitle?: undefined;
        };
        container: boolean;
        children: {
            n: string;
            t: string;
            d: {
                text: string;
            };
        }[];
    } | {
        n: string;
        b: string;
        t: string;
        d: {
            title: string;
            subtitle: string;
            direction?: undefined;
            gap?: undefined;
            width?: undefined;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                type: string;
                placeholder: string;
                text?: undefined;
                class?: undefined;
            };
        } | {
            n: string;
            t: string;
            d: {
                text: string;
                class: string;
                type?: undefined;
                placeholder?: undefined;
            };
        })[];
    })[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        padding: string;
    };
    container: boolean;
    children: ({
        n: string;
        t: string;
        d: {
            text: string;
            items?: undefined;
        };
        b?: undefined;
    } | {
        n: string;
        b: string;
        t: string;
        d: {
            items: string;
            text?: undefined;
        };
    })[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        padding: string;
    };
    container: boolean;
    children: {
        n: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                width: string;
                src?: undefined;
                alt?: undefined;
            };
            container: boolean;
            children: {
                n: string;
                t: string;
                d: {
                    text: string;
                };
            }[];
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                src: string;
                alt: string;
                direction?: undefined;
                gap?: undefined;
                width?: undefined;
            };
            container?: undefined;
            children?: undefined;
        })[];
    }[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        padding: string;
        align: string;
    };
    container: boolean;
    children: ({
        n: string;
        t: string;
        d: {
            text: string;
            columns?: undefined;
        };
        i?: undefined;
        b?: undefined;
        container?: undefined;
        gridChildren?: undefined;
    } | {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            columns: string;
            text?: undefined;
        };
        container: boolean;
        gridChildren: ({
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                plan: string;
                price: string;
                period: string;
                features: string;
                cta: string;
                featured?: undefined;
            };
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                plan: string;
                price: string;
                period: string;
                features: string;
                cta: string;
                featured: string;
            };
        })[];
    })[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        padding: string;
        align: string;
    };
    container: boolean;
    children: ({
        n: string;
        t: string;
        d: {
            text: string;
            columns?: undefined;
        };
        i?: undefined;
        b?: undefined;
        container?: undefined;
        gridChildren?: undefined;
    } | {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            columns: string;
            text?: undefined;
        };
        container: boolean;
        gridChildren: {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                name: string;
                role: string;
                avatar: string;
            };
        }[];
    })[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        padding: string;
        align: string;
    };
    container: boolean;
    children: ({
        n: string;
        t: string;
        d: {
            text: string;
            columns?: undefined;
        };
        i?: undefined;
        b?: undefined;
        container?: undefined;
        gridChildren?: undefined;
    } | {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            columns: string;
            text?: undefined;
        };
        container: boolean;
        gridChildren: {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                quote: string;
                author: string;
                role: string;
                rating: string;
            };
        }[];
    })[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        padding: string;
        align: string;
    };
    container: boolean;
    children: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            columns: string;
        };
        container: boolean;
        gridChildren: ({
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                value: string;
                label: string;
                icon: string;
                trend: string;
                trendValue: string;
            };
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                value: string;
                label: string;
                icon: string;
                trend?: undefined;
                trendValue?: undefined;
            };
        })[];
    }[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        padding: string;
        align: string;
    };
    container: boolean;
    children: ({
        n: string;
        t: string;
        d: {
            text: string;
            direction?: undefined;
            gap?: undefined;
        };
        b?: undefined;
        container?: undefined;
        children?: undefined;
    } | {
        n: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            text?: undefined;
        };
        container: boolean;
        children: {
            n: string;
            b: string;
            t: string;
            d: {
                summary: string;
            };
            children: {
                t: string;
                text: string;
            }[];
        }[];
    })[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        padding: string;
        align: string;
        justify: string;
        background: string;
    };
    container: boolean;
    children: ({
        n: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            width: string;
            src?: undefined;
            alt?: undefined;
            style?: undefined;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                direction?: undefined;
                gap?: undefined;
            };
            b?: undefined;
            container?: undefined;
            children?: undefined;
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            children: {
                n: string;
                t: string;
                d: {
                    text: string;
                    class: string;
                };
            }[];
        })[];
    } | {
        n: string;
        b: string;
        t: string;
        d: {
            src: string;
            alt: string;
            style: string;
            direction?: undefined;
            gap?: undefined;
            width?: undefined;
        };
        container?: undefined;
        children?: undefined;
    })[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        padding: string;
        align: string;
    };
    container: boolean;
    children: ({
        n: string;
        t: string;
        d: {
            text: string;
            columns?: undefined;
            gap?: undefined;
        };
        i?: undefined;
        b?: undefined;
        container?: undefined;
        gridChildren?: undefined;
    } | {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            columns: string;
            gap: string;
            text?: undefined;
        };
        container: boolean;
        gridChildren: {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                title: string;
                description: string;
                price: string;
                image: string;
                cta: string;
            };
        }[];
    })[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        padding: string;
    };
    container: boolean;
    children: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            columns: number;
            gap: string;
        };
        container: boolean;
        children: {
            n: string;
            b: string;
            t: string;
            d: {
                src: string;
                alt: string;
            };
        }[];
    }[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        padding: string;
        align: string;
    };
    container: boolean;
    children: ({
        n: string;
        t: string;
        d: {
            text: string;
            columns?: undefined;
            gap?: undefined;
        };
        i?: undefined;
        b?: undefined;
        container?: undefined;
        gridChildren?: undefined;
    } | {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            columns: string;
            gap: string;
            text?: undefined;
        };
        container: boolean;
        gridChildren: ({
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                title: string;
                price: string;
                image: string;
                badge: string;
            };
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                title: string;
                price: string;
                image: string;
                badge?: undefined;
            };
        })[];
    })[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        padding: string;
        align: string;
    };
    container: boolean;
    children: ({
        n: string;
        t: string;
        d: {
            text: string;
            style: string;
            class?: undefined;
        };
    } | {
        n: string;
        t: string;
        d: {
            text: string;
            style?: undefined;
            class?: undefined;
        };
    } | {
        n: string;
        t: string;
        d: {
            text: string;
            class: string;
            style?: undefined;
        };
    })[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        padding: string;
        align: string;
        minHeight: string;
        justify: string;
    };
    container: boolean;
    children: {
        n: string;
        b: string;
        t: string;
        d: {
            title: string;
            subtitle: string;
            style: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                type: string;
                placeholder: string;
                direction?: undefined;
                justify?: undefined;
                width?: undefined;
                text?: undefined;
                class?: undefined;
            };
            b?: undefined;
            container?: undefined;
            children?: undefined;
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                justify: string;
                width: string;
                type?: undefined;
                placeholder?: undefined;
                text?: undefined;
                class?: undefined;
            };
            container: boolean;
            children: ({
                n: string;
                t: string;
                d: {
                    type: string;
                    label: string;
                    text?: undefined;
                    href?: undefined;
                };
            } | {
                n: string;
                t: string;
                d: {
                    text: string;
                    href: string;
                    type?: undefined;
                    label?: undefined;
                };
            })[];
        } | {
            n: string;
            t: string;
            d: {
                text: string;
                class: string;
                type?: undefined;
                placeholder?: undefined;
                direction?: undefined;
                justify?: undefined;
                width?: undefined;
            };
            b?: undefined;
            container?: undefined;
            children?: undefined;
        })[];
    }[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        padding: string;
        justify: string;
        align: string;
    };
    container: boolean;
    children: ({
        n: string;
        t: string;
        d: {
            text: string;
            direction?: undefined;
            gap?: undefined;
        };
        b?: undefined;
        container?: undefined;
        children?: undefined;
    } | {
        n: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            text?: undefined;
        };
        container: boolean;
        children: {
            n: string;
            t: string;
            d: {
                text: string;
                href: string;
            };
        }[];
    })[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        padding: string;
    };
    container: boolean;
    children: ({
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            columns: string;
            text?: undefined;
        };
        container: boolean;
        gridChildren: {
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
            };
            container: boolean;
            children: ({
                n: string;
                t: string;
                d: {
                    text: string;
                    href?: undefined;
                };
            } | {
                n: string;
                t: string;
                d: {
                    text: string;
                    href: string;
                };
            })[];
        }[];
    } | {
        n: string;
        t: string;
        d: {
            text: string;
            columns?: undefined;
        };
        i?: undefined;
        b?: undefined;
        container?: undefined;
        gridChildren?: undefined;
    })[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        padding: string;
        align: string;
    };
    container: boolean;
    children: ({
        n: string;
        t: string;
        d: {
            text: string;
            columns?: undefined;
        };
        i?: undefined;
        b?: undefined;
        container?: undefined;
        gridChildren?: undefined;
    } | {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            columns: string;
            text?: undefined;
        };
        container: boolean;
        gridChildren: {
            n: string;
            b: string;
            t: string;
            d: {
                src: string;
                alt: string;
            };
        }[];
    })[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        padding: string;
        maxWidth: string;
        margin: string;
    };
    container: boolean;
    children: ({
        n: string;
        t: string;
        d: {
            text: string;
            src?: undefined;
            alt?: undefined;
        };
        b?: undefined;
    } | {
        n: string;
        b: string;
        t: string;
        d: {
            src: string;
            alt: string;
            text?: undefined;
        };
    })[];
} | {
    n: string;
    i: string;
    b: string;
    t: string;
    d: {
        direction: string;
        gap: string;
        padding: string;
        align: string;
    };
    container: boolean;
    children: ({
        n: string;
        t: string;
        d: {
            text: string;
            direction?: undefined;
            gap?: undefined;
            justify?: undefined;
        };
        b?: undefined;
        container?: undefined;
        children?: undefined;
    } | {
        n: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            justify: string;
            text?: undefined;
        };
        container: boolean;
        children: ({
            n: string;
            i: string;
            t: string;
            d: {
                type: string;
                placeholder: string;
                text?: undefined;
                class?: undefined;
            };
        } | {
            n: string;
            t: string;
            d: {
                text: string;
                class: string;
                type?: undefined;
                placeholder?: undefined;
            };
            i?: undefined;
        })[];
    })[];
})[];
/**
 * Get templates by category
 */
export function getPageTemplatesByCategory(categoryId: any): {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    preview: string;
    sections: string[];
}[];
/**
 * Get section templates by category
 */
export function getSectionTemplatesByCategory(categoryId: any): ({
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            logo: string;
            sticky: string;
        };
        container: boolean;
        children: {
            n: string;
            t: string;
            d: {
                class: string;
            };
            container: boolean;
            children: {
                n: string;
                t: string;
                d: {
                    text: string;
                    href: string;
                    class: string;
                };
            }[];
        }[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            variant: string;
            title: string;
            subtitle: string;
            cta: string;
            ctaHref: string;
            height: string;
            align: string;
            overlay: boolean;
        };
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
            maxWidth: string;
            margin: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    subtitle: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    subtitle: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    subtitle: string;
                    image: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    name: string;
                    role: string;
                    avatar: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    quote: string;
                    author: string;
                    role: string;
                    rating: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: ({
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    plan: string;
                    price: string;
                    period: string;
                    features: string;
                    cta: string;
                    featured?: undefined;
                };
            } | {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    plan: string;
                    price: string;
                    period: string;
                    features: string;
                    cta: string;
                    featured: string;
                };
            })[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
            maxWidth: string;
            margin: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                direction?: undefined;
                gap?: undefined;
                width?: undefined;
            };
            b?: undefined;
            container?: undefined;
            children?: undefined;
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                width: string;
                text?: undefined;
            };
            container: boolean;
            children: {
                n: string;
                b: string;
                t: string;
                d: {
                    summary: string;
                };
                children: {
                    t: string;
                    text: string;
                }[];
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
                maxWidth?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                maxWidth: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: ({
                n: string;
                b: string;
                t: string;
                d: {
                    direction: string;
                    gap: string;
                    title?: undefined;
                };
                container: boolean;
                children: {
                    n: string;
                    i: string;
                    b: string;
                    t: string;
                    d: {
                        title: string;
                        subtitle: string;
                    };
                }[];
            } | {
                n: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    direction?: undefined;
                    gap?: undefined;
                };
                container: boolean;
                children: ({
                    n: string;
                    t: string;
                    d: {
                        type: string;
                        placeholder: string;
                        rows?: undefined;
                        text?: undefined;
                        class?: undefined;
                    };
                } | {
                    n: string;
                    t: string;
                    d: {
                        placeholder: string;
                        rows: string;
                        type?: undefined;
                        text?: undefined;
                        class?: undefined;
                    };
                } | {
                    n: string;
                    t: string;
                    d: {
                        text: string;
                        class: string;
                        type?: undefined;
                        placeholder?: undefined;
                        rows?: undefined;
                    };
                })[];
            })[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
        };
        container: boolean;
        children: ({
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
                style?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                b: string;
                t: string;
                d: {
                    direction: string;
                    gap: string;
                };
                container: boolean;
                children: ({
                    n: string;
                    t: string;
                    d: {
                        text: string;
                        href?: undefined;
                    };
                } | {
                    n: string;
                    t: string;
                    d: {
                        text: string;
                        href: string;
                    };
                })[];
            }[];
        } | {
            n: string;
            t: string;
            d: {
                text: string;
                style: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            variant: string;
            title: string;
            subtitle: string;
            cta: string;
            ctaHref: string;
            height: string;
            align: string;
            overlay: boolean;
        };
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    subtitle: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
            maxWidth: string;
            margin: string;
        };
        container: boolean;
        children: {
            n: string;
            t: string;
            d: {
                text: string;
            };
        }[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            align: string;
            padding: string;
        };
        container: boolean;
        children: ({
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                src?: undefined;
                alt?: undefined;
            };
            container: boolean;
            children: ({
                n: string;
                t: string;
                d: {
                    text: string;
                    class?: undefined;
                };
            } | {
                n: string;
                t: string;
                d: {
                    text: string;
                    class: string;
                };
            })[];
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                src: string;
                alt: string;
                direction?: undefined;
                gap?: undefined;
            };
            container?: undefined;
            children?: undefined;
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
            justify: string;
        };
        container: boolean;
        children: ({
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                width: string;
                title?: undefined;
                subtitle?: undefined;
            };
            container: boolean;
            children: {
                n: string;
                t: string;
                d: {
                    text: string;
                };
            }[];
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                title: string;
                subtitle: string;
                direction?: undefined;
                gap?: undefined;
                width?: undefined;
            };
            container: boolean;
            children: ({
                n: string;
                t: string;
                d: {
                    type: string;
                    placeholder: string;
                    text?: undefined;
                    class?: undefined;
                };
            } | {
                n: string;
                t: string;
                d: {
                    text: string;
                    class: string;
                    type?: undefined;
                    placeholder?: undefined;
                };
            })[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                items?: undefined;
            };
            b?: undefined;
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                items: string;
                text?: undefined;
            };
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
        };
        container: boolean;
        children: {
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                align: string;
            };
            container: boolean;
            children: ({
                n: string;
                b: string;
                t: string;
                d: {
                    direction: string;
                    gap: string;
                    width: string;
                    src?: undefined;
                    alt?: undefined;
                };
                container: boolean;
                children: {
                    n: string;
                    t: string;
                    d: {
                        text: string;
                    };
                }[];
            } | {
                n: string;
                b: string;
                t: string;
                d: {
                    src: string;
                    alt: string;
                    direction?: undefined;
                    gap?: undefined;
                    width?: undefined;
                };
                container?: undefined;
                children?: undefined;
            })[];
        }[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: ({
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    plan: string;
                    price: string;
                    period: string;
                    features: string;
                    cta: string;
                    featured?: undefined;
                };
            } | {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    plan: string;
                    price: string;
                    period: string;
                    features: string;
                    cta: string;
                    featured: string;
                };
            })[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    name: string;
                    role: string;
                    avatar: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    quote: string;
                    author: string;
                    role: string;
                    rating: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
            };
            container: boolean;
            gridChildren: ({
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    value: string;
                    label: string;
                    icon: string;
                    trend: string;
                    trendValue: string;
                };
            } | {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    value: string;
                    label: string;
                    icon: string;
                    trend?: undefined;
                    trendValue?: undefined;
                };
            })[];
        }[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                direction?: undefined;
                gap?: undefined;
            };
            b?: undefined;
            container?: undefined;
            children?: undefined;
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            children: {
                n: string;
                b: string;
                t: string;
                d: {
                    summary: string;
                };
                children: {
                    t: string;
                    text: string;
                }[];
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
            justify: string;
            background: string;
        };
        container: boolean;
        children: ({
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                width: string;
                src?: undefined;
                alt?: undefined;
                style?: undefined;
            };
            container: boolean;
            children: ({
                n: string;
                t: string;
                d: {
                    text: string;
                    direction?: undefined;
                    gap?: undefined;
                };
                b?: undefined;
                container?: undefined;
                children?: undefined;
            } | {
                n: string;
                b: string;
                t: string;
                d: {
                    direction: string;
                    gap: string;
                    text?: undefined;
                };
                container: boolean;
                children: {
                    n: string;
                    t: string;
                    d: {
                        text: string;
                        class: string;
                    };
                }[];
            })[];
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                src: string;
                alt: string;
                style: string;
                direction?: undefined;
                gap?: undefined;
                width?: undefined;
            };
            container?: undefined;
            children?: undefined;
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            variant: string;
            title: string;
            subtitle: string;
            cta: string;
            ctaHref: string;
            height: string;
            align: string;
            overlay: boolean;
            backgroundImage: string;
        };
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    description: string;
                    price: string;
                    image: string;
                    cta: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
        };
        container: boolean;
        children: {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: number;
                gap: string;
            };
            container: boolean;
            children: {
                n: string;
                b: string;
                t: string;
                d: {
                    src: string;
                    alt: string;
                };
            }[];
        }[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: ({
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    price: string;
                    image: string;
                    badge: string;
                };
            } | {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    price: string;
                    image: string;
                    badge?: undefined;
                };
            })[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                style: string;
                class?: undefined;
            };
        } | {
            n: string;
            t: string;
            d: {
                text: string;
                style?: undefined;
                class?: undefined;
            };
        } | {
            n: string;
            t: string;
            d: {
                text: string;
                class: string;
                style?: undefined;
            };
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
            minHeight: string;
            justify: string;
        };
        container: boolean;
        children: {
            n: string;
            b: string;
            t: string;
            d: {
                title: string;
                subtitle: string;
                style: string;
            };
            container: boolean;
            children: ({
                n: string;
                t: string;
                d: {
                    type: string;
                    placeholder: string;
                    direction?: undefined;
                    justify?: undefined;
                    width?: undefined;
                    text?: undefined;
                    class?: undefined;
                };
                b?: undefined;
                container?: undefined;
                children?: undefined;
            } | {
                n: string;
                b: string;
                t: string;
                d: {
                    direction: string;
                    justify: string;
                    width: string;
                    type?: undefined;
                    placeholder?: undefined;
                    text?: undefined;
                    class?: undefined;
                };
                container: boolean;
                children: ({
                    n: string;
                    t: string;
                    d: {
                        type: string;
                        label: string;
                        text?: undefined;
                        href?: undefined;
                    };
                } | {
                    n: string;
                    t: string;
                    d: {
                        text: string;
                        href: string;
                        type?: undefined;
                        label?: undefined;
                    };
                })[];
            } | {
                n: string;
                t: string;
                d: {
                    text: string;
                    class: string;
                    type?: undefined;
                    placeholder?: undefined;
                    direction?: undefined;
                    justify?: undefined;
                    width?: undefined;
                };
                b?: undefined;
                container?: undefined;
                children?: undefined;
            })[];
        }[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            justify: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                direction?: undefined;
                gap?: undefined;
            };
            b?: undefined;
            container?: undefined;
            children?: undefined;
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            children: {
                n: string;
                t: string;
                d: {
                    text: string;
                    href: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
        };
        container: boolean;
        children: ({
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                b: string;
                t: string;
                d: {
                    direction: string;
                    gap: string;
                };
                container: boolean;
                children: ({
                    n: string;
                    t: string;
                    d: {
                        text: string;
                        href?: undefined;
                    };
                } | {
                    n: string;
                    t: string;
                    d: {
                        text: string;
                        href: string;
                    };
                })[];
            }[];
        } | {
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                b: string;
                t: string;
                d: {
                    src: string;
                    alt: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    subtitle: string;
                    image: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            maxWidth: string;
            margin: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                src?: undefined;
                alt?: undefined;
            };
            b?: undefined;
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                src: string;
                alt: string;
                text?: undefined;
            };
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                direction?: undefined;
                gap?: undefined;
                justify?: undefined;
            };
            b?: undefined;
            container?: undefined;
            children?: undefined;
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                justify: string;
                text?: undefined;
            };
            container: boolean;
            children: ({
                n: string;
                i: string;
                t: string;
                d: {
                    type: string;
                    placeholder: string;
                    text?: undefined;
                    class?: undefined;
                };
            } | {
                n: string;
                t: string;
                d: {
                    text: string;
                    class: string;
                    type?: undefined;
                    placeholder?: undefined;
                };
                i?: undefined;
            })[];
        })[];
    }[];
})[];
/**
 * Get unique categories from section templates
 */
export function getSectionCategories(): any[];
/**
 * Get unique categories from page templates
 */
export function getPageCategories(): any[];
/**
 * WB Builder Templates Registry
 * -----------------------------------------------------------------------------
 * This file contains the definitions for all Page and Section templates used
 * in the Website Builder.
 *
 * HOW TO USE:
 * 1. To add a new Section Template:
 *    - Add an entry to the SECTION_TEMPLATES array.
 *    - Ensure it has a unique 'id'.
 *    - Assign it to a 'category' (see SECTION_CATEGORIES).
 *    - Define the 'components' array using the WB shorthand:
 *      n: name, i: icon, b: behavior, t: tag, d: data attributes
 *
 * 2. To add a new Page Template:
 *    - Add an entry to the PAGE_TEMPLATES array.
 *    - Define the 'sections' array with IDs of sections to include.
 *    - Provide a 'preview' string describing the flow.
 *
 * 3. To add a new Category:
 *    - Add to PAGE_CATEGORIES or SECTION_CATEGORIES arrays.
 *
 * 4. Theming:
 *    - Templates automatically inherit the active theme.
 *    - Use standard components (Card, Hero, Section) for best results.
 * -----------------------------------------------------------------------------
 */
export const SECTION_TEMPLATES: ({
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            logo: string;
            sticky: string;
        };
        container: boolean;
        children: {
            n: string;
            t: string;
            d: {
                class: string;
            };
            container: boolean;
            children: {
                n: string;
                t: string;
                d: {
                    text: string;
                    href: string;
                    class: string;
                };
            }[];
        }[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            variant: string;
            title: string;
            subtitle: string;
            cta: string;
            ctaHref: string;
            height: string;
            align: string;
            overlay: boolean;
        };
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
            maxWidth: string;
            margin: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    subtitle: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    subtitle: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    subtitle: string;
                    image: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    name: string;
                    role: string;
                    avatar: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    quote: string;
                    author: string;
                    role: string;
                    rating: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: ({
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    plan: string;
                    price: string;
                    period: string;
                    features: string;
                    cta: string;
                    featured?: undefined;
                };
            } | {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    plan: string;
                    price: string;
                    period: string;
                    features: string;
                    cta: string;
                    featured: string;
                };
            })[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
            maxWidth: string;
            margin: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                direction?: undefined;
                gap?: undefined;
                width?: undefined;
            };
            b?: undefined;
            container?: undefined;
            children?: undefined;
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                width: string;
                text?: undefined;
            };
            container: boolean;
            children: {
                n: string;
                b: string;
                t: string;
                d: {
                    summary: string;
                };
                children: {
                    t: string;
                    text: string;
                }[];
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            id: string;
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
                maxWidth?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                maxWidth: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: ({
                n: string;
                b: string;
                t: string;
                d: {
                    direction: string;
                    gap: string;
                    title?: undefined;
                };
                container: boolean;
                children: {
                    n: string;
                    i: string;
                    b: string;
                    t: string;
                    d: {
                        title: string;
                        subtitle: string;
                    };
                }[];
            } | {
                n: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    direction?: undefined;
                    gap?: undefined;
                };
                container: boolean;
                children: ({
                    n: string;
                    t: string;
                    d: {
                        type: string;
                        placeholder: string;
                        rows?: undefined;
                        text?: undefined;
                        class?: undefined;
                    };
                } | {
                    n: string;
                    t: string;
                    d: {
                        placeholder: string;
                        rows: string;
                        type?: undefined;
                        text?: undefined;
                        class?: undefined;
                    };
                } | {
                    n: string;
                    t: string;
                    d: {
                        text: string;
                        class: string;
                        type?: undefined;
                        placeholder?: undefined;
                        rows?: undefined;
                    };
                })[];
            })[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
        };
        container: boolean;
        children: ({
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
                style?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                b: string;
                t: string;
                d: {
                    direction: string;
                    gap: string;
                };
                container: boolean;
                children: ({
                    n: string;
                    t: string;
                    d: {
                        text: string;
                        href?: undefined;
                    };
                } | {
                    n: string;
                    t: string;
                    d: {
                        text: string;
                        href: string;
                    };
                })[];
            }[];
        } | {
            n: string;
            t: string;
            d: {
                text: string;
                style: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            variant: string;
            title: string;
            subtitle: string;
            cta: string;
            ctaHref: string;
            height: string;
            align: string;
            overlay: boolean;
        };
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    subtitle: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
            maxWidth: string;
            margin: string;
        };
        container: boolean;
        children: {
            n: string;
            t: string;
            d: {
                text: string;
            };
        }[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            align: string;
            padding: string;
        };
        container: boolean;
        children: ({
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                src?: undefined;
                alt?: undefined;
            };
            container: boolean;
            children: ({
                n: string;
                t: string;
                d: {
                    text: string;
                    class?: undefined;
                };
            } | {
                n: string;
                t: string;
                d: {
                    text: string;
                    class: string;
                };
            })[];
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                src: string;
                alt: string;
                direction?: undefined;
                gap?: undefined;
            };
            container?: undefined;
            children?: undefined;
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
            justify: string;
        };
        container: boolean;
        children: ({
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                width: string;
                title?: undefined;
                subtitle?: undefined;
            };
            container: boolean;
            children: {
                n: string;
                t: string;
                d: {
                    text: string;
                };
            }[];
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                title: string;
                subtitle: string;
                direction?: undefined;
                gap?: undefined;
                width?: undefined;
            };
            container: boolean;
            children: ({
                n: string;
                t: string;
                d: {
                    type: string;
                    placeholder: string;
                    text?: undefined;
                    class?: undefined;
                };
            } | {
                n: string;
                t: string;
                d: {
                    text: string;
                    class: string;
                    type?: undefined;
                    placeholder?: undefined;
                };
            })[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                items?: undefined;
            };
            b?: undefined;
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                items: string;
                text?: undefined;
            };
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
        };
        container: boolean;
        children: {
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                align: string;
            };
            container: boolean;
            children: ({
                n: string;
                b: string;
                t: string;
                d: {
                    direction: string;
                    gap: string;
                    width: string;
                    src?: undefined;
                    alt?: undefined;
                };
                container: boolean;
                children: {
                    n: string;
                    t: string;
                    d: {
                        text: string;
                    };
                }[];
            } | {
                n: string;
                b: string;
                t: string;
                d: {
                    src: string;
                    alt: string;
                    direction?: undefined;
                    gap?: undefined;
                    width?: undefined;
                };
                container?: undefined;
                children?: undefined;
            })[];
        }[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: ({
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    plan: string;
                    price: string;
                    period: string;
                    features: string;
                    cta: string;
                    featured?: undefined;
                };
            } | {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    plan: string;
                    price: string;
                    period: string;
                    features: string;
                    cta: string;
                    featured: string;
                };
            })[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    name: string;
                    role: string;
                    avatar: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    quote: string;
                    author: string;
                    role: string;
                    rating: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
            };
            container: boolean;
            gridChildren: ({
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    value: string;
                    label: string;
                    icon: string;
                    trend: string;
                    trendValue: string;
                };
            } | {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    value: string;
                    label: string;
                    icon: string;
                    trend?: undefined;
                    trendValue?: undefined;
                };
            })[];
        }[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                direction?: undefined;
                gap?: undefined;
            };
            b?: undefined;
            container?: undefined;
            children?: undefined;
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            children: {
                n: string;
                b: string;
                t: string;
                d: {
                    summary: string;
                };
                children: {
                    t: string;
                    text: string;
                }[];
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
            justify: string;
            background: string;
        };
        container: boolean;
        children: ({
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                width: string;
                src?: undefined;
                alt?: undefined;
                style?: undefined;
            };
            container: boolean;
            children: ({
                n: string;
                t: string;
                d: {
                    text: string;
                    direction?: undefined;
                    gap?: undefined;
                };
                b?: undefined;
                container?: undefined;
                children?: undefined;
            } | {
                n: string;
                b: string;
                t: string;
                d: {
                    direction: string;
                    gap: string;
                    text?: undefined;
                };
                container: boolean;
                children: {
                    n: string;
                    t: string;
                    d: {
                        text: string;
                        class: string;
                    };
                }[];
            })[];
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                src: string;
                alt: string;
                style: string;
                direction?: undefined;
                gap?: undefined;
                width?: undefined;
            };
            container?: undefined;
            children?: undefined;
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            variant: string;
            title: string;
            subtitle: string;
            cta: string;
            ctaHref: string;
            height: string;
            align: string;
            overlay: boolean;
            backgroundImage: string;
        };
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    description: string;
                    price: string;
                    image: string;
                    cta: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
        };
        container: boolean;
        children: {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: number;
                gap: string;
            };
            container: boolean;
            children: {
                n: string;
                b: string;
                t: string;
                d: {
                    src: string;
                    alt: string;
                };
            }[];
        }[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
                gap?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: ({
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    price: string;
                    image: string;
                    badge: string;
                };
            } | {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    price: string;
                    image: string;
                    badge?: undefined;
                };
            })[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                style: string;
                class?: undefined;
            };
        } | {
            n: string;
            t: string;
            d: {
                text: string;
                style?: undefined;
                class?: undefined;
            };
        } | {
            n: string;
            t: string;
            d: {
                text: string;
                class: string;
                style?: undefined;
            };
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
            minHeight: string;
            justify: string;
        };
        container: boolean;
        children: {
            n: string;
            b: string;
            t: string;
            d: {
                title: string;
                subtitle: string;
                style: string;
            };
            container: boolean;
            children: ({
                n: string;
                t: string;
                d: {
                    type: string;
                    placeholder: string;
                    direction?: undefined;
                    justify?: undefined;
                    width?: undefined;
                    text?: undefined;
                    class?: undefined;
                };
                b?: undefined;
                container?: undefined;
                children?: undefined;
            } | {
                n: string;
                b: string;
                t: string;
                d: {
                    direction: string;
                    justify: string;
                    width: string;
                    type?: undefined;
                    placeholder?: undefined;
                    text?: undefined;
                    class?: undefined;
                };
                container: boolean;
                children: ({
                    n: string;
                    t: string;
                    d: {
                        type: string;
                        label: string;
                        text?: undefined;
                        href?: undefined;
                    };
                } | {
                    n: string;
                    t: string;
                    d: {
                        text: string;
                        href: string;
                        type?: undefined;
                        label?: undefined;
                    };
                })[];
            } | {
                n: string;
                t: string;
                d: {
                    text: string;
                    class: string;
                    type?: undefined;
                    placeholder?: undefined;
                    direction?: undefined;
                    justify?: undefined;
                    width?: undefined;
                };
                b?: undefined;
                container?: undefined;
                children?: undefined;
            })[];
        }[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            justify: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                direction?: undefined;
                gap?: undefined;
            };
            b?: undefined;
            container?: undefined;
            children?: undefined;
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                text?: undefined;
            };
            container: boolean;
            children: {
                n: string;
                t: string;
                d: {
                    text: string;
                    href: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
        };
        container: boolean;
        children: ({
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                b: string;
                t: string;
                d: {
                    direction: string;
                    gap: string;
                };
                container: boolean;
                children: ({
                    n: string;
                    t: string;
                    d: {
                        text: string;
                        href?: undefined;
                    };
                } | {
                    n: string;
                    t: string;
                    d: {
                        text: string;
                        href: string;
                    };
                })[];
            }[];
        } | {
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                b: string;
                t: string;
                d: {
                    src: string;
                    alt: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                columns?: undefined;
            };
            i?: undefined;
            b?: undefined;
            container?: undefined;
            gridChildren?: undefined;
        } | {
            n: string;
            i: string;
            b: string;
            t: string;
            d: {
                columns: string;
                text?: undefined;
            };
            container: boolean;
            gridChildren: {
                n: string;
                i: string;
                b: string;
                t: string;
                d: {
                    title: string;
                    subtitle: string;
                    image: string;
                };
            }[];
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            maxWidth: string;
            margin: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                src?: undefined;
                alt?: undefined;
            };
            b?: undefined;
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                src: string;
                alt: string;
                text?: undefined;
            };
        })[];
    }[];
} | {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    components: {
        n: string;
        i: string;
        b: string;
        t: string;
        d: {
            direction: string;
            gap: string;
            padding: string;
            align: string;
        };
        container: boolean;
        children: ({
            n: string;
            t: string;
            d: {
                text: string;
                direction?: undefined;
                gap?: undefined;
                justify?: undefined;
            };
            b?: undefined;
            container?: undefined;
            children?: undefined;
        } | {
            n: string;
            b: string;
            t: string;
            d: {
                direction: string;
                gap: string;
                justify: string;
                text?: undefined;
            };
            container: boolean;
            children: ({
                n: string;
                i: string;
                t: string;
                d: {
                    type: string;
                    placeholder: string;
                    text?: undefined;
                    class?: undefined;
                };
            } | {
                n: string;
                t: string;
                d: {
                    text: string;
                    class: string;
                    type?: undefined;
                    placeholder?: undefined;
                };
                i?: undefined;
            })[];
        })[];
    }[];
})[];
export const PAGE_TEMPLATES: {
    id: string;
    name: string;
    icon: string;
    desc: string;
    category: string;
    preview: string;
    sections: string[];
}[];
export const PAGE_CATEGORIES: {
    id: string;
    name: string;
    icon: string;
    desc: string;
}[];
export const SECTION_CATEGORIES: {
    id: string;
    name: string;
    icon: string;
}[];
//# sourceMappingURL=builder-templates.d.ts.map